import React, { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  housePlanAtom,
  styleThemeAtom,
  cameraViewAtom,
  circadianModeIndexAtom,
  circadianProgressAtom,
  isPlayingTimelineAtom,
  showDimensionsAtom,
  activeDrawerAtom,
  spawnedPropsAtom,
  selectedPropIdAtom,
  roomDimensionsAtom,
  isAudioEnabledAtom,
  statusCalloutAtom,
  isBudgetDrawerOpenAtom,
  isDossierModalOpenAtom,
  isLightFixturesOnAtom,
  showOutdoorTerraceAtom,
  isStructuralLockedAtom,
  lockedElementIdsAtom,
  isMeasureToolActiveAtom,
  isImageTo3dModalOpenAtom
} from '../../store/atoms';
import { MODES, PLAN_SPECS, INITIAL_MEDITERRANEAN_PROPS } from '../../data/constants';
import { physicsEngine } from '../../physics/physicsEngine';
import { playChime, setAudioMute } from '../../audio/audioSystem';

export default function StudioUi() {
  const [housePlan, setHousePlan] = useAtom(housePlanAtom);
  const [styleTheme, setStyleTheme] = useAtom(styleThemeAtom);
  const [cameraView, setCameraView] = useAtom(cameraViewAtom);
  const [circadianIndex, setCircadianIndex] = useAtom(circadianModeIndexAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingTimelineAtom);
  const [showDimensions, setShowDimensions] = useAtom(showDimensionsAtom);
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);
  const [spawnedProps, setSpawnedProps] = useAtom(spawnedPropsAtom);
  const setSelectedPropId = useSetAtom(selectedPropIdAtom);
  const [roomDimensions, setRoomDimensions] = useAtom(roomDimensionsAtom);
  const [isAudioEnabled, setIsAudioEnabled] = useAtom(isAudioEnabledAtom);
  const [statusCallout, setStatusCallout] = useAtom(statusCalloutAtom);
  const setIsBudgetDrawerOpen = useSetAtom(isBudgetDrawerOpenAtom);
  const setIsDossierModalOpen = useSetAtom(isDossierModalOpenAtom);
  const [isLightFixturesOn, setIsLightFixturesOn] = useAtom(isLightFixturesOnAtom);
  const [showOutdoorTerrace, setShowOutdoorTerrace] = useAtom(showOutdoorTerraceAtom);
  const [isStructuralLocked, setIsStructuralLocked] = useAtom(isStructuralLockedAtom);
  const setLockedElementIds = useSetAtom(lockedElementIdsAtom);
  const [isMeasureToolActive, setIsMeasureToolActive] = useAtom(isMeasureToolActiveAtom);
  const setIsImageTo3dModalOpen = useSetAtom(isImageTo3dModalOpenAtom);

  const handleToggleStructuralLock = () => {
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

  const planSpec = PLAN_SPECS[housePlan] || PLAN_SPECS.villa;
  const currentMode = MODES[circadianIndex];

  // Auto-play day cycle timeline
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCircadianIndex(prev => (prev + 1) % MODES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, setCircadianIndex]);

  // Update status callout when mode changes
  useEffect(() => {
    setStatusCallout(MODES[circadianIndex].callout);
  }, [circadianIndex, setStatusCallout]);

  const handlePlanChange = (planId) => {
    setHousePlan(planId);
    const spec = PLAN_SPECS[planId];
    if (spec) {
      setRoomDimensions(spec.defaultDim);
    }
    playChime(520);
  };

  const handleStyleChange = (styleKey) => {
    setStyleTheme(styleKey);
    playChime(640);
  };

  const handleViewChange = (viewKey) => {
    setCameraView(viewKey);
  };

  const handleSpawnCrate = () => {
    const id = `prop-${Date.now()}`;
    const x = (Math.random() - 0.5) * (roomDimensions.width * 0.4);
    const y = 3.0 + Math.random() * 0.4;
    const z = (Math.random() - 0.5) * (roomDimensions.depth * 0.4);

    const record = physicsEngine.createBody(id, 'crate-wood', x, y, z);
    if (record) {
      setSpawnedProps(prev => [...prev, { id, type: 'crate-wood', name: 'Timber Shipping Crate', x, y, z }]);
      setSelectedPropId(id);
      playChime(660);
    }
  };

  const handleClearPhysics = () => {
    physicsEngine.clear();
    setSpawnedProps([]);
    setSelectedPropId(null);
    playChime(330);
  };

  const handleStageMediterranean = () => {
    physicsEngine.clear();
    const stagedList = [];
    INITIAL_MEDITERRANEAN_PROPS.forEach(p => {
      const halfH = physicsEngine.getHalfHeight(p.type);
      const safeY = halfH + 0.04;
      const record = physicsEngine.createBody(p.id, p.type, p.x, safeY, p.z);
      if (record) {
        stagedList.push({ ...p, y: safeY });
      }
    });
    setSpawnedProps(stagedList);
    setStyleTheme('mediterranean');
    if (stagedList.length > 0) {
      setSelectedPropId(stagedList[0].id);
    }
    playChime(784);
  };

  const handleToggleSound = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    setAudioMute(nextState);
  };

  const scrubberPercent = (circadianIndex / (MODES.length - 1)) * 100;

  return (
    <div id="studio-ui" className="studio-ui-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="brand">
          <div className="brand-meta-badge">
            <span className="brand-meta-dot" />
            <span className="meta-specs" id="room-meta-specs">{planSpec.specsBadge}</span>
          </div>
          <h1 className="title">Wolfitway <em>Wolf 3D</em> <span className="brand-subtag">Spatial</span></h1>
        </div>

        {/* Center Controls: House Plan & Architectural Styles */}
        <div className="header-center-controls">
          <div className="plan-selector-bar" role="toolbar" aria-label="House Architecture Layouts">
            <span className="control-label">Plan:</span>
            <button
              className={`plan-pill ${housePlan === 'villa' ? 'active' : ''}`}
              id="plan-villa"
              onClick={() => handlePlanChange('villa')}
            >
              Villa (3-Room)
            </button>
            <button
              className={`plan-pill ${housePlan === 'studio' ? 'active' : ''}`}
              id="plan-studio"
              onClick={() => handlePlanChange('studio')}
            >
              Micro Studio
            </button>
            <button
              className={`plan-pill ${housePlan === 'loft' ? 'active' : ''}`}
              id="plan-loft"
              onClick={() => handlePlanChange('loft')}
            >
              Open Loft
            </button>
          </div>

          <div className="style-selector-bar" role="toolbar" aria-label="Aesthetic Styles">
            <span className="control-label">Style:</span>
            <button
              className={`style-pill ${styleTheme === 'scandi' ? 'active' : ''}`}
              id="style-scandi"
              onClick={() => handleStyleChange('scandi')}
            >
              Scandinavian
            </button>
            <button
              className={`style-pill ${styleTheme === 'mediterranean' ? 'active' : ''}`}
              id="style-med"
              onClick={() => handleStyleChange('mediterranean')}
            >
              Mediterranean
            </button>
            <button
              className={`style-pill ${styleTheme === 'european' ? 'active' : ''}`}
              id="style-euro"
              onClick={() => handleStyleChange('european')}
            >
              European Classic
            </button>
            <button
              className={`style-pill ${styleTheme === 'japandi' ? 'active' : ''}`}
              id="style-japandi"
              onClick={() => handleStyleChange('japandi')}
            >
              Asian Japandi
            </button>
          </div>
        </div>

        {/* Camera Views */}
        <nav className="view-toggles" aria-label="Camera Views">
          <button
            className={`view-btn ${cameraView === 'overall' ? 'active' : ''}`}
            id="view-overall"
            onClick={() => handleViewChange('overall')}
          >
            Overall
          </button>
          <button
            className={`view-btn ${cameraView === 'joinery' ? 'active' : ''}`}
            id="view-joinery"
            onClick={() => handleViewChange('joinery')}
          >
            Joinery
          </button>
          <button
            className={`view-btn ${cameraView === 'walk' ? 'active' : ''}`}
            id="view-walk"
            title="Enter First-Person Walkthrough & VIP Tour"
            onClick={() => handleViewChange('walk')}
          >
            Walkthrough
          </button>
          <button
            className={`view-btn ${cameraView === 'plan' ? 'active' : ''}`}
            id="view-plan"
            onClick={() => handleViewChange('plan')}
          >
            Plan (CAD)
          </button>
        </nav>
      </header>

      {/* Contextual Status Subtitle */}
      <div className="status-callout" id="status-callout">
        <span className="pulse-dot" />
        <span className="callout-text" id="callout-text" dangerouslySetInnerHTML={{ __html: statusCallout }} />
      </div>

      {/* Quick Floating Action Toolbar */}
      <aside className="quick-toolbar" aria-label="Interactive Tools">
        {/* Global Shell Lock / Movable Switch */}
        <button
          className={`tool-btn ${isStructuralLocked ? 'highlight' : 'danger'}`}
          id="toggle-structural-lock-btn"
          title={isStructuralLocked ? "Walls & Floor are Locked (Safe Decorating). Click to Unlock for Moving [Shortcut: L]" : "Walls & Floor are Unlocked (Movable). Click to Lock [Shortcut: L]"}
          onClick={handleToggleStructuralLock}
        >
          <span className="tool-icon">{isStructuralLocked ? '🔒' : '🔓'}</span>
          <span className="tool-text">{isStructuralLocked ? 'Shell Locked' : 'Shell Movable'}</span>
        </button>
        <button
          className={`tool-btn ${isMeasureToolActive ? 'highlight' : ''}`}
          id="toggle-measure-btn"
          title="Toggle 1:1 Metric Laser Tape Measure [Shortcut: M]"
          onClick={() => {
            setIsMeasureToolActive(!isMeasureToolActive);
            playChime(640);
          }}
        >
          <span className="tool-icon">📐</span>
          <span className="tool-text">Measure [M]</span>
        </button>
        <button
          className="tool-btn highlight-gold"
          id="open-image-to-3d-btn"
          title="AI Photo to 3D: Upload or Pick Image to Generate & Place 3D Model [Shortcut: U]"
          onClick={() => {
            setIsImageTo3dModalOpen(true);
            playChime(760);
          }}
        >
          <span className="tool-icon">📸</span>
          <span className="tool-text">Photo to 3D</span>
        </button>
        <button
          className="tool-btn highlight-med"
          id="stage-med-suite-btn"
          title="Stage Real Mediterranean Suite (Credenza, Table, Drawers, Decor)"
          onClick={handleStageMediterranean}
        >
          <span className="tool-icon">🏛️</span>
          <span className="tool-text">Med Suite</span>
        </button>
        <button
          className="tool-btn highlight"
          id="spawn-crate-btn"
          title="Spawn Physics Crate (Drops with Gravity)"
          onClick={handleSpawnCrate}
        >
          <span className="tool-icon">📦</span>
          <span className="tool-text">Drop Crate</span>
        </button>
        <button
          className="tool-btn"
          id="open-catalog-btn"
          title="Open Product & Furniture Catalog"
          onClick={() => setActiveDrawer(activeDrawer === 'catalog' ? null : 'catalog')}
        >
          <span className="tool-icon">🪑</span>
          <span className="tool-text">Furniture</span>
        </button>
        <button
          className="tool-btn"
          id="open-cad-btn"
          title="Parametric Room Blueprint & Dimensions"
          onClick={() => setActiveDrawer(activeDrawer === 'cad' ? null : 'cad')}
        >
          <span className="tool-icon">📐</span>
          <span className="tool-text">Room CAD</span>
        </button>
        <button
          className={`tool-btn ${activeDrawer === 'budget' ? 'highlight' : ''}`}
          id="open-budget-btn"
          title="Open Live Architectural Investment & Budget Calculator"
          onClick={() => {
            setActiveDrawer(activeDrawer === 'budget' ? null : 'budget');
            playChime(560);
          }}
        >
          <span className="tool-icon">💰</span>
          <span className="tool-text">Budget ROI</span>
        </button>
        <button
          className="tool-btn"
          id="open-dossier-btn"
          title="Generate One-Click Architectural Proposal Dossier"
          onClick={() => {
            setIsDossierModalOpen(true);
            playChime(680);
          }}
        >
          <span className="tool-icon">📑</span>
          <span className="tool-text">Dossier</span>
        </button>
        <button
          className={`tool-btn ${showOutdoorTerrace ? 'highlight' : ''}`}
          id="toggle-terrace-btn"
          title="Toggle Cantilevered Timber Terrace & Infinity Pool"
          onClick={() => {
            setShowOutdoorTerrace(!showOutdoorTerrace);
            playChime(600);
          }}
        >
          <span className="tool-icon">🏊</span>
          <span className="tool-text">Terrace</span>
        </button>
        <button
          className={`tool-btn ${isLightFixturesOn ? 'highlight' : ''}`}
          id="toggle-lights-btn"
          title="Toggle Interior Fixture Lighting & Hearth Flames"
          onClick={() => {
            setIsLightFixturesOn(!isLightFixturesOn);
            playChime(640);
          }}
        >
          <span className="tool-icon">{isLightFixturesOn ? '💡' : '🌑'}</span>
          <span className="tool-text">Lights</span>
        </button>
        <button
          className={`tool-btn ${showDimensions ? 'highlight' : ''}`}
          id="toggle-dimensions-btn"
          title="Toggle 3D BIM Dimension Rulers"
          onClick={() => setShowDimensions(!showDimensions)}
        >
          <span className="tool-icon">📏</span>
          <span className="tool-text">Rulers</span>
        </button>
        <button
          className="tool-btn"
          id="clear-physics-btn"
          title="Reset Spawned Physics Objects"
          onClick={handleClearPhysics}
        >
          <span className="tool-icon">🧹</span>
          <span className="tool-text">Clear Props</span>
        </button>
      </aside>



      {/* Studio Bottom Bar */}
      <footer className="bottom-bar">
        <div className="mode-selector" role="tablist">
          {MODES.map((m, idx) => (
            <button
              key={m.num}
              className={`mode-tab ${circadianIndex === idx ? 'active' : ''}`}
              id={`tab-${m.name.toLowerCase()}`}
              onClick={() => {
                setCircadianIndex(idx);
                playChime(440 + idx * 80);
              }}
            >
              <span className="mode-num">{m.num}</span>
              <span className="mode-label">{m.name}</span>
            </button>
          ))}
        </div>

        <div className="timeline-controls">
          <div className="time-readout" id="time-display">{currentMode.timeStr}</div>

          <div className="scrubber-wrapper">
            <div className="scrubber-track" id="scrubber-track">
              <div className="scrubber-progress" id="scrubber-progress" style={{ width: `${scrubberPercent}%` }} />
              <div className="scrubber-thumb" id="scrubber-thumb" style={{ left: `${scrubberPercent}%` }} />
              <div className="scrubber-marker" style={{ left: '0%' }} />
              <div className="scrubber-marker" style={{ left: '33.33%' }} />
              <div className="scrubber-marker" style={{ left: '66.66%' }} />
              <div className="scrubber-marker" style={{ left: '100%' }} />
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="ctrl-btn play-btn"
              id="play-btn"
              title="Toggle Auto-Play Day Cycle"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <svg id="play-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                {isPlaying ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </>
                ) : (
                  <polygon points="5,3 19,12 5,21" />
                )}
              </svg>
              <span id="play-label">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              className="ctrl-btn next-btn"
              id="next-btn"
              title="Jump to Next Transformation"
              onClick={() => {
                setCircadianIndex((circadianIndex + 1) % MODES.length);
                playChime(520);
              }}
            >
              <span>Next</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              className="ctrl-btn icon-only-btn"
              id="sound-btn"
              title="Ambient Room Sound [Shortcut: M]"
              onClick={handleToggleSound}
            >
              {isAudioEnabled ? (
                <svg id="sound-icon-on" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg id="sound-icon-muted" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <button
              className="ctrl-btn icon-only-btn"
              id="info-btn"
              title="About / Engine Specs"
              onClick={() => setActiveDrawer(activeDrawer === 'info' ? null : 'info')}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
