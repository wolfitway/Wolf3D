import React, { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  activeDrawerAtom,
  housePlanAtom,
  roomDimensionsAtom,
  roomAreaAtom,
  roomVolumeAtom,
  cameraViewAtom
} from '../../store/atoms';
import { PLAN_SPECS } from '../../data/constants';
import { PRESET_2D_PLANS, parse2DPlanJson } from '../canvas/BlueprintRebuilderEngine';
import { playChime, playSnap } from '../../audio/audioSystem';

const SAMPLE_2D_PLAN = JSON.stringify({
  id: "custom-duplex",
  name: "Modern 2-Level Executive Duplex",
  subtitle: "Rebuilt from 2D Architectural CAD Vector Data",
  dimensions: { width: 10.5, depth: 8.0, height: 3.5 },
  rooms: [
    { id: "salon-a", name: "Grand Living Salon", center: [-2.5, 0, 0], size: [5.5, 7.0], area: 38.5, level: "±0.000 FFL", ceiling: "3.50m" },
    { id: "kitchen-b", name: "Culinary Island & Dining", center: [2.6, 0, -2.0], size: [4.8, 3.8], area: 18.2, level: "±0.000 FFL", ceiling: "3.50m" },
    { id: "suite-c", name: "Master Suite Sanctuary", center: [2.6, 0, 1.9], size: [4.8, 4.1], area: 19.7, level: "±0.000 FFL", ceiling: "3.50m" }
  ],
  description: "Accurately extruded 1:1 metric room boundaries directly from architectural CAD floor plan."
}, null, 2);

export default function CadDrawer() {
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);
  const [housePlan, setHousePlan] = useAtom(housePlanAtom);
  const [roomDimensions, setRoomDimensions] = useAtom(roomDimensionsAtom);
  const roomArea = useAtomValue(roomAreaAtom);
  const roomVolume = useAtomValue(roomVolumeAtom);
  const [cameraView, setCameraView] = useAtom(cameraViewAtom);

  const [customPlanJson, setCustomPlanJson] = useState(SAMPLE_2D_PLAN);
  const [rebuildStatus, setRebuildStatus] = useState(null);
  const [isJsonOpen, setIsJsonOpen] = useState(true);

  const isOpen = activeDrawer === 'cad';
  const planSpec = PLAN_SPECS[housePlan] || PLAN_SPECS.villa;

  const handlePlanSelect = (planKey) => {
    setHousePlan(planKey);
    const spec = PLAN_SPECS[planKey];
    if (spec) setRoomDimensions(spec.defaultDim);
    setRebuildStatus({ success: true, message: `Loaded preset: ${spec ? spec.name : planKey}` });
    playChime(520);
  };

  const handleRebuildFromPlan = () => {
    const res = parse2DPlanJson(customPlanJson);
    if (!res.success) {
      setRebuildStatus({ success: false, message: `Error parsing plan: ${res.error}` });
      playChime(240);
      return;
    }

    const { dimensions, name, rooms } = res.plan;
    setRoomDimensions({
      width: dimensions.width,
      depth: dimensions.depth,
      height: dimensions.height
    });

    if (window.__wolfUpdatePlacementGrid) {
      window.__wolfUpdatePlacementGrid(dimensions.width, dimensions.depth);
    }

    setRebuildStatus({
      success: true,
      message: `Successfully rebuilt 3D rooms for "${name}" (${rooms.length} zones, ${dimensions.width}m × ${dimensions.depth}m).`
    });
    playChime(880);
    playSnap();
  };

  const handleReset = () => {
    const spec = PLAN_SPECS[housePlan];
    if (spec) setRoomDimensions(spec.defaultDim);
    setRebuildStatus(null);
    playChime(440);
  };

  return (
    <div className={`panel-drawer left-drawer ${isOpen ? 'open' : ''}`} id="cad-drawer">
      <div className="drawer-header">
        <div className="drawer-title-group">
          <h3>ArchiCAD 2D Plan & BIM Rebuilder</h3>
          <span className="drawer-subhead">1:1 Metric Calibration & Direct Floorplan Ingestion</span>
        </div>
        <button className="close-btn" id="close-cad-btn" onClick={() => setActiveDrawer(null)}>
          &times;
        </button>
      </div>
      <div className="drawer-body">
        <p className="catalog-hint">
          Reconstruct real-world houses room-by-room. Ingest any 2D architectural blueprint or choose from calibrated 1:1 BIM templates.
        </p>

        {/* 2D Plan Rebuilder Engine */}
        <div className="cad-section cad-rebuilder-section">
          <div className="rebuilder-header">
            <h4>🛠️ 2D Plan Rebuilder Engine</h4>
            <span className="engine-badge">1:1 METRIC BIM</span>
          </div>
          <p className="rebuilder-desc">
            Give the engine a 2D floor plan specification and it extrudes exact room boundaries, walls, and circulation zones.
          </p>

          <div className="rebuilder-quick-actions">
            <button
              className="ctrl-btn text-xs"
              id="cad-sample-plan-btn"
              onClick={() => {
                setCustomPlanJson(SAMPLE_2D_PLAN);
                setIsJsonOpen(true);
                playSnap();
              }}
            >
              📋 Load Sample 2D Blueprint Spec
            </button>
            <button
              className="ctrl-btn text-xs"
              onClick={() => setIsJsonOpen(!isJsonOpen)}
            >
              {isJsonOpen ? 'Hide 2D Plan Input' : '✏️ Edit Custom 2D Plan'}
            </button>
          </div>

          {isJsonOpen && (
            <div className="rebuilder-json-box">
              <label htmlFor="custom-plan-input" className="json-label">2D Blueprint JSON Definition:</label>
              <textarea
                id="custom-plan-input"
                className="plan-json-textarea"
                rows={7}
                value={customPlanJson}
                onChange={(e) => setCustomPlanJson(e.target.value)}
                placeholder="Paste 2D plan JSON with dimensions and room zones..."
              />
              <button
                className="featured-stage-btn full-width mt-2"
                id="cad-rebuild-3d-btn"
                onClick={handleRebuildFromPlan}
              >
                <span>⚡</span>
                <span>Rebuild 3D House From This 2D Plan</span>
              </button>
            </div>
          )}

          {rebuildStatus && (
            <div className={`rebuilder-status-pill ${rebuildStatus.success ? 'success' : 'error'}`}>
              <span>{rebuildStatus.success ? '✓' : '⚠️'}</span>
              <span>{rebuildStatus.message}</span>
            </div>
          )}
        </div>

        <div className="cad-section">
          <h4>Architectural Floorplan Presets</h4>
          <div className="plan-preset-grid">
            <button
              className={`plan-card ${housePlan === 'villa' ? 'active' : ''}`}
              id="cad-plan-villa"
              onClick={() => handlePlanSelect('villa')}
            >
              <div className="plan-card-icon">🏡</div>
              <div className="plan-card-title">Villa Suite (3-Room)</div>
              <div className="plan-card-meta">11.0 &times; 7.8m &bull; 85.8 M&sup2; &bull; Salon, Kitchen & Master Suite</div>
            </button>
            <button
              className={`plan-card ${housePlan === 'studio' ? 'active' : ''}`}
              id="cad-plan-studio"
              onClick={() => handlePlanSelect('studio')}
            >
              <div className="plan-card-icon">📐</div>
              <div className="plan-card-title">Adaptive Micro Studio</div>
              <div className="plan-card-meta">6.8 &times; 5.2m &bull; 35.4 M&sup2; &bull; Modular Joinery</div>
            </button>
            <button
              className={`plan-card ${housePlan === 'loft' ? 'active' : ''}`}
              id="cad-plan-loft"
              onClick={() => handlePlanSelect('loft')}
            >
              <div className="plan-card-icon">🏢</div>
              <div className="plan-card-title">Open Industrial Loft</div>
              <div className="plan-card-meta">9.0 &times; 7.0m &bull; 63.0 M&sup2; &bull; Creative Open Plan</div>
            </button>
            <button
              className={`plan-card ${housePlan === 'urban2bed' ? 'active' : ''}`}
              id="cad-plan-urban2bed"
              onClick={() => handlePlanSelect('urban2bed')}
            >
              <div className="plan-card-icon">🏙️</div>
              <div className="plan-card-title">Urban 2-Bedroom</div>
              <div className="plan-card-meta">10.0 &times; 7.2m &bull; 72.0 M&sup2; &bull; Dual Suite & Balcony</div>
            </button>
          </div>
        </div>

        <div className="cad-section">
          <h4>Parametric Scaling</h4>
          <div className="cad-slider-group">
            <div className="slider-header">
              <label htmlFor="room-width-slider">Footprint Width</label>
              <span className="slider-val" id="val-width">{roomDimensions.width.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              id="room-width-slider"
              min="5.0"
              max="14.0"
              step="0.2"
              value={roomDimensions.width}
              onChange={(e) => setRoomDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="cad-slider-group">
            <div className="slider-header">
              <label htmlFor="room-depth-slider">Footprint Depth</label>
              <span className="slider-val" id="val-depth">{roomDimensions.depth.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              id="room-depth-slider"
              min="4.0"
              max="10.0"
              step="0.2"
              value={roomDimensions.depth}
              onChange={(e) => setRoomDimensions(prev => ({ ...prev, depth: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="cad-slider-group">
            <div className="slider-header">
              <label htmlFor="room-height-slider">Ceiling Height</label>
              <span className="slider-val" id="val-height">{roomDimensions.height.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              id="room-height-slider"
              min="2.6"
              max="4.8"
              step="0.1"
              value={roomDimensions.height}
              onChange={(e) => setRoomDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
            />
          </div>
        </div>

        <div className="cad-readout-card">
          <div className="readout-row">
            <span>Enclosed Floor Area:</span>
            <strong id="readout-area">{roomArea} M&sup2;</strong>
          </div>
          <div className="readout-row">
            <span>Internal Volume:</span>
            <strong id="readout-volume">{roomVolume} M&sup3;</strong>
          </div>
          <div className="readout-row">
            <span>Partition Portals:</span>
            <strong id="readout-doors">{planSpec.stats.doors}</strong>
          </div>
          <div className="readout-row">
            <span>Physics Rigid Bodies:</span>
            <strong id="readout-bodies">Active (Rapier WASM)</strong>
          </div>
        </div>

        <div className="cad-actions">
          <button className="ctrl-btn full-width" id="reset-cad-btn" onClick={handleReset}>
            Reset Current Plan Dimensions
          </button>
        </div>
      </div>
    </div>
  );
}
