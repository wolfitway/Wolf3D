import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  cameraViewAtom,
  housePlanAtom,
  roomDimensionsAtom,
  roomAreaAtom,
  roomVolumeAtom,
  isStructuralLockedAtom,
  lockedElementIdsAtom,
  archicadScaleAtom,
  showCadRoomTagsAtom,
  showCadDoorSwingsAtom,
  showDimensionsAtom,
  activeRoomFilterAtom,
  cadSheetThemeAtom,
  spawnedPropsAtom,
  isMeasureToolActiveAtom,
  laserMeasurementsAtom
} from '../../store/atoms';
import { ROOM_ZONES } from '../../data/constants';
import { playChime, playSnap } from '../../audio/audioSystem';

export default function ArchicadPlanHud() {
  const [cameraView, setCameraView] = useAtom(cameraViewAtom);
  const housePlan = useAtomValue(housePlanAtom);
  const roomDimensions = useAtomValue(roomDimensionsAtom);
  const roomArea = useAtomValue(roomAreaAtom);
  const roomVolume = useAtomValue(roomVolumeAtom);
  const [isStructuralLocked, setIsStructuralLocked] = useAtom(isStructuralLockedAtom);
  const [lockedElementIds, setLockedElementIds] = useAtom(lockedElementIdsAtom);
  const [archicadScale, setArchicadScale] = useAtom(archicadScaleAtom);
  const [showCadRoomTags, setShowCadRoomTags] = useAtom(showCadRoomTagsAtom);
  const [showCadDoorSwings, setShowCadDoorSwings] = useAtom(showCadDoorSwingsAtom);
  const [showDimensions, setShowDimensions] = useAtom(showDimensionsAtom);
  const [activeRoomFilter, setActiveRoomFilter] = useAtom(activeRoomFilterAtom);
  const [cadSheetTheme, setCadSheetTheme] = useAtom(cadSheetThemeAtom);
  const spawnedProps = useAtomValue(spawnedPropsAtom);
  const [isMeasureToolActive, setIsMeasureToolActive] = useAtom(isMeasureToolActiveAtom);
  const [laserMeasurements, setLaserMeasurements] = useAtom(laserMeasurementsAtom);

  if (cameraView !== 'plan') return null;

  const currentZones = ROOM_ZONES[housePlan] || ROOM_ZONES.villa;

  const handleToggleGlobalLock = () => {
    const nextLocked = !isStructuralLocked;
    setIsStructuralLocked(nextLocked);
    if (nextLocked) {
      setLockedElementIds([
        'struct-floor',
        'struct-wall-back',
        'struct-wall-left',
        'struct-partition-main',
        'struct-window-main',
        'struct-island',
        'struct-bed-master'
      ]);
      playChime(380);
    } else {
      setLockedElementIds([]);
      playChime(720);
    }
  };

  const handleRoomFocus = (zone) => {
    setActiveRoomFilter(zone ? zone.id : 'all');
    playChime(560);
    if (window.__wolfPanToPlanCoordinates) {
      if (zone) {
        window.__wolfPanToPlanCoordinates(zone.center[0], zone.center[2], 14.0);
      } else {
        window.__wolfPanToPlanCoordinates(0, 0, 23.0);
      }
    }
  };

  return (
    <div className={`archicad-plan-hud-overlay theme-${cadSheetTheme}`} id="archicad-plan-hud">
      {/* Top Drafting Control Bar */}
      <header className="archicad-header-bar">
        <div className="archicad-title-block">
          <div className="archicad-badge">ARCHICAD BIM 2D/3D</div>
          <h2 className="archicad-sheet-title">GROUND FLOOR ARCHITECTURAL PLAN</h2>
          <span className="archicad-scale-indicator">1:1 Metric Calibration &bull; Active Scale: {archicadScale}</span>
        </div>

        {/* Global Structural Lock & Security Pill */}
        <div className="archicad-security-group">
          <button
            className={`archicad-btn-lock ${isStructuralLocked ? 'is-locked' : 'is-unlocked'}`}
            id="archicad-global-lock-btn"
            title="Lock or Unlock all Walls, Floors, and Partitions for Moving"
            onClick={handleToggleGlobalLock}
          >
            <span className="lock-icon">{isStructuralLocked ? '🔒' : '🔓'}</span>
            <div className="lock-text-group">
              <span className="lock-label">
                {isStructuralLocked ? 'Walls & Floor: Locked' : 'Walls & Floor: Movable'}
              </span>
              <span className="lock-subtext">
                {isStructuralLocked ? 'Safe Decorating Mode' : 'Click to Lock Shell'}
              </span>
            </div>
          </button>
        </div>

        {/* CAD Presentation Layer Toggles */}
        <div className="archicad-tools-group">
          <button
            className={`cad-toggle-btn ${showDimensions ? 'active' : ''}`}
            id="cad-toggle-dims-btn"
            title="Toggle 1:1 Metric BIM Dimension Chains"
            onClick={() => setShowDimensions(!showDimensions)}
          >
            <span>📏</span>
            <span>Dimensions</span>
          </button>

          <button
            className={`cad-toggle-btn ${showCadRoomTags ? 'active' : ''}`}
            id="cad-toggle-tags-btn"
            title="Toggle Room Area Tags (M²)"
            onClick={() => setShowCadRoomTags(!showCadRoomTags)}
          >
            <span>🏷️</span>
            <span>Room Tags</span>
          </button>

          <button
            className={`cad-toggle-btn ${showCadDoorSwings ? 'active' : ''}`}
            id="cad-toggle-doors-btn"
            title="Toggle 90° Door Swing Clearance Arcs"
            onClick={() => setShowCadDoorSwings(!showCadDoorSwings)}
          >
            <span>🚪</span>
            <span>Door Swings</span>
          </button>

          {/* Precision Laser Measuring Tape Tool */}
          <button
            className={`cad-toggle-btn ${isMeasureToolActive ? 'active' : ''}`}
            id="cad-toggle-measure-btn"
            title="1:1 Metric Laser Tape Measure Tool [M] - Click point A then point B to measure"
            onClick={() => {
              setIsMeasureToolActive(!isMeasureToolActive);
              playSnap();
            }}
          >
            <span>📐</span>
            <span>Laser Tape {isMeasureToolActive ? '(Active [M])' : '[M]'}</span>
            {laserMeasurements.length > 0 && (
              <span className="cad-badge-count">{laserMeasurements.length}</span>
            )}
          </button>

          {laserMeasurements.length > 0 && (
            <button
              className="cad-toggle-btn text-xs"
              id="cad-clear-measurements-btn"
              title="Clear all pinned laser measurements"
              onClick={() => {
                setLaserMeasurements([]);
                playSnap();
              }}
            >
              <span>✕</span>
              <span>Clear Measures</span>
            </button>
          )}

          {/* Scale Selector */}
          <div className="cad-scale-selector">
            <span className="scale-label">Scale:</span>
            {['1:20', '1:50', '1:100'].map(sc => (
              <button
                key={sc}
                className={`scale-pill ${archicadScale === sc ? 'active' : ''}`}
                onClick={() => { setArchicadScale(sc); playSnap(); }}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Sheet Background Theme */}
          <div className="cad-theme-selector">
            <button
              className={`theme-icon-btn ${cadSheetTheme === 'blueprint' ? 'active' : ''}`}
              title="Blueprint Cyan"
              onClick={() => setCadSheetTheme('blueprint')}
            >
              📐
            </button>
            <button
              className={`theme-icon-btn ${cadSheetTheme === 'classic' ? 'active' : ''}`}
              title="Classic Parchment"
              onClick={() => setCadSheetTheme('classic')}
            >
              📜
            </button>
            <button
              className={`theme-icon-btn ${cadSheetTheme === 'dark' ? 'active' : ''}`}
              title="Modern Dark CAD"
              onClick={() => setCadSheetTheme('dark')}
            >
              ⬛
            </button>
          </div>

          <button
            className="cad-exit-btn"
            id="cad-exit-plan-btn"
            title="Return to 3D Perspective Mode"
            onClick={() => setCameraView('overall')}
          >
            <span>✕ 3D View</span>
          </button>
        </div>
      </header>

      {/* Room-by-Room Jump Navigation Ribbon */}
      <nav className="archicad-room-ribbon" aria-label="Room by Room Navigator">
        <span className="ribbon-label">Room-by-Room Decorator Focus:</span>
        <button
          className={`room-chip ${activeRoomFilter === 'all' ? 'active' : ''}`}
          id="cad-room-all"
          onClick={() => handleRoomFocus(null)}
        >
          <span>🌐 Whole House</span>
          <span className="room-chip-meta">{roomArea} M²</span>
        </button>

        {currentZones.map(zone => (
          <button
            key={zone.id}
            className={`room-chip ${activeRoomFilter === zone.id ? 'active' : ''}`}
            id={`cad-room-${zone.id}`}
            onClick={() => handleRoomFocus(zone)}
          >
            <span>{zone.name}</span>
            <span className="room-chip-meta">{zone.area} M²</span>
          </button>
        ))}
      </nav>

      {/* ArchiCAD Standard Architectural Title Block (Bottom Right) */}
      <footer className="archicad-title-stamp">
        <div className="stamp-col">
          <div className="stamp-row header-row">
            <span className="stamp-org">WOLFITWAY ARCHICAD BIM SUITE</span>
            <span className="stamp-rev">REV 2.4</span>
          </div>
          <div className="stamp-row">
            <span className="stamp-label">PROJECT:</span>
            <strong className="stamp-val">Bespoke Architectural Residence</strong>
          </div>
          <div className="stamp-row">
            <span className="stamp-label">ENCLOSED AREA:</span>
            <strong className="stamp-val">{roomArea} M&sup2; &bull; {roomVolume} M&sup3;</strong>
          </div>
          <div className="stamp-row">
            <span className="stamp-label">DIMENSIONS:</span>
            <strong className="stamp-val">{roomDimensions.width.toFixed(2)}m &times; {roomDimensions.depth.toFixed(2)}m (Ceiling: {roomDimensions.height.toFixed(2)}m)</strong>
          </div>
          <div className="stamp-row">
            <span className="stamp-label">FURNITURE ITEMS:</span>
            <strong className="stamp-val">{spawnedProps.length} Movable &bull; {isStructuralLocked ? 'Shell Locked 🔒' : 'Shell Movable 🔓'}</strong>
          </div>
        </div>
        <div className="stamp-north-arrow" title="True North Orientation">
          <div className="north-arrow-icon">↑</div>
          <div className="north-arrow-text">NORTH</div>
        </div>
      </footer>
    </div>
  );
}
