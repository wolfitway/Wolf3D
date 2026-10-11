import React, { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  appModeAtom,
  housePlanAtom,
  atmosphereMoodAtom,
  cameraViewAtom,
  circadianModeIndexAtom,
  isLetterboxAtom,
  isAudioEnabledAtom,
  isTourActiveAtom,
  isTourPausedAtom,
  tourStopIndexAtom,
  tourProgressAtom,
  isTourDirectorOpenAtom,
  snapshotFlashTriggerAtom,
  isBudgetDrawerOpenAtom,
  isDossierModalOpenAtom
} from '../../store/atoms';
import { ATMOSPHERE_MOODS, PLAN_SPECS, ROOM_BOOKMARKS, TOUR_ROUTES, MODES } from '../../data/constants';
import { playChime, setAudioMute } from '../../audio/audioSystem';
import MinimapRadar from './MinimapRadar';
import SpecModal from './SpecModal';
import TourDirectorModal from './TourDirectorModal';

export default function PresentationUi() {
  const [appMode, setAppMode] = useAtom(appModeAtom);
  const housePlan = useAtomValue(housePlanAtom);
  const [atmosphereMood, setAtmosphereMood] = useAtom(atmosphereMoodAtom);
  const setCameraView = useSetAtom(cameraViewAtom);
  const [circadianIndex, setCircadianIndex] = useAtom(circadianModeIndexAtom);
  const [isLetterbox, setIsLetterbox] = useAtom(isLetterboxAtom);
  const [isAudioEnabled, setIsAudioEnabled] = useAtom(isAudioEnabledAtom);

  const [isTourActive, setIsTourActive] = useAtom(isTourActiveAtom);
  const [isTourPaused, setIsTourPaused] = useAtom(isTourPausedAtom);
  const [tourStopIndex, setTourStopIndex] = useAtom(tourStopIndexAtom);
  const tourProgress = useAtomValue(tourProgressAtom);
  const setIsTourDirectorOpen = useSetAtom(isTourDirectorOpenAtom);
  const setFlashTrigger = useSetAtom(snapshotFlashTriggerAtom);
  const setIsBudgetDrawerOpen = useSetAtom(isBudgetDrawerOpenAtom);
  const setIsDossierModalOpen = useSetAtom(isDossierModalOpenAtom);

  const [activeBookmark, setActiveBookmark] = useState('entrance');

  const planSpec = PLAN_SPECS[housePlan] || PLAN_SPECS.villa;
  const currentTourRoute = TOUR_ROUTES[housePlan] || TOUR_ROUTES.villa;
  const currentTourStop = currentTourRoute[tourStopIndex] || currentTourRoute[0];

  const handleStartTour = () => {
    setTourStopIndex(0);
    setIsTourActive(true);
    setIsTourPaused(false);
    setCameraView('walk');
    playChime(660);
  };

  const handleToggleSound = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    setAudioMute(nextState);
  };

  const handleSnapshot = () => {
    setFlashTrigger(Date.now());
    playChime(880);
    // Find canvas and download snapshot
    const canvas = document.querySelector('#canvas-container canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Wolfitway-VIP-${housePlan}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleBookmarkClick = (key) => {
    setActiveBookmark(key);
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark(key);
    }
    setCameraView('walk');
    playChime(523.25);
  };

  return (
    <div id="presentation-ui" className="presentation-ui-container">
      {/* Top Luxury Presentation Header */}
      <header className="pres-header">
        <div className="pres-brand-block">
          <div className="pres-badge">
            <span className="pres-dot" />
            <span className="pres-badge-text">WOLFITWAY VIP // PROJECT WOLF 3D</span>
          </div>
          <h2 className="pres-title" id="pres-title">
            {planSpec.name} <span className="pres-subtitle" id="pres-subtitle">&bull; {planSpec.subtitle}</span>
          </h2>
          <div className="pres-specs-strip" id="pres-specs-strip">
            <span className="spec-item"><strong id="pres-stat-area">{planSpec.stats.area}</strong> Footprint</span>
            <span className="spec-divider">&bull;</span>
            <span className="spec-item"><strong id="pres-stat-height">{planSpec.stats.height}</strong> Ceiling</span>
            <span className="spec-divider">&bull;</span>
            <span className="spec-item"><strong id="pres-stat-daylight">{planSpec.stats.daylight}</strong> Daylight Factor</span>
            <span className="spec-divider">&bull;</span>
            <span className="spec-item"><strong id="pres-stat-carbon">{planSpec.stats.carbon}</strong> Embodied Carbon</span>
          </div>
        </div>

        {/* Center: Atmosphere & Lighting Moods */}
        <div className="pres-mood-group" role="toolbar" aria-label="Lighting & Sun Ambiance">
          <span className="pres-mood-label">Ambiance:</span>
          <div className="pres-mood-pills">
            <button
              className={`pres-mood-pill ${atmosphereMood === 'day' ? 'active' : ''}`}
              id="pres-mood-day"
              title="Bright natural morning daylight (5500K)"
              onClick={() => {
                setAtmosphereMood('day');
                playChime(440);
              }}
            >
              <span className="mood-icon">☀️</span>
              <span className="mood-text">Daylight</span>
            </button>
            <button
              className={`pres-mood-pill ${atmosphereMood === 'sunset' ? 'active' : ''}`}
              id="pres-mood-sunset"
              title="Golden hour warm amber light & long shadows (3000K)"
              onClick={() => {
                setAtmosphereMood('sunset');
                playChime(480);
              }}
            >
              <span className="mood-icon">🌅</span>
              <span className="mood-text">Golden Hour</span>
            </button>
            <button
              className={`pres-mood-pill ${atmosphereMood === 'dusk' ? 'active' : ''}`}
              id="pres-mood-dusk"
              title="Cozy twilight lounge with warm recessed LEDs"
              onClick={() => {
                setAtmosphereMood('dusk');
                playChime(520);
              }}
            >
              <span className="mood-icon">🍸</span>
              <span className="mood-text">Twilight</span>
            </button>
            <button
              className={`pres-mood-pill ${atmosphereMood === 'night' ? 'active' : ''}`}
              id="pres-mood-night"
              title="Moody moonlight & intimate architectural spotlights"
              onClick={() => {
                setAtmosphereMood('night');
                playChime(560);
              }}
            >
              <span className="mood-icon">🌙</span>
              <span className="mood-text">Midnight</span>
            </button>
          </div>
        </div>

        {/* Right: Client Presentation Control Actions */}
        <div className="pres-actions">
          <button
            className="pres-cta-btn highlight"
            id="pres-start-tour-btn"
            title="Start Unified First-Person Walkthrough & Guided VIP Tour [Shortcut: Space]"
            onClick={handleStartTour}
          >
            <span className="btn-icon">🚶</span>
            <span>VIP Walkthrough</span>
          </button>

          <button
            className="pres-cta-btn"
            id="pres-tour-director-btn"
            title="Open Custom Tour Moves Creator & Director"
            onClick={() => setIsTourDirectorOpen(true)}
          >
            <span className="btn-icon">🎬</span>
            <span>Tour Moves</span>
          </button>

          <button
            className={`pres-cta-btn ${isLetterbox ? 'highlight' : ''}`}
            id="pres-letterbox-btn"
            title="Toggle 2.39:1 Hollywood Anamorphic Cinema Letterbox [Shortcut: C]"
            onClick={() => setIsLetterbox(!isLetterbox)}
          >
            <span className="btn-icon">🎞️</span>
            <span>Cinema</span>
          </button>

          <button
            className="pres-cta-btn"
            id="pres-budget-btn"
            title="Open Live Architectural Investment & Cost Feasibility"
            onClick={() => {
              setIsBudgetDrawerOpen(true);
              playChime(560);
            }}
          >
            <span className="btn-icon">💰</span>
            <span>Budget</span>
          </button>

          <button
            className="pres-cta-btn highlight"
            id="pres-dossier-btn"
            title="Generate Executive Architectural Specification & Investment Dossier"
            onClick={() => {
              setIsDossierModalOpen(true);
              playChime(680);
            }}
          >
            <span className="btn-icon">📑</span>
            <span>Dossier</span>
          </button>

          <button
            className="pres-icon-btn"
            id="pres-sound-btn"
            title="Toggle Showroom Audio Ambience [Shortcut: M]"
            onClick={handleToggleSound}
          >
            <span id="pres-sound-icon">{isAudioEnabled ? '🎵' : '🔇'}</span>
          </button>

          <button
            className="pres-icon-btn"
            id="pres-snapshot-btn"
            title="Capture 4K Presentation Snapshot"
            onClick={handleSnapshot}
          >
            <span>📸</span>
          </button>

          <button
            className="pres-icon-btn"
            id="pres-fullscreen-btn"
            title="Toggle Fullscreen Presentation [Shortcut: F]"
            onClick={handleToggleFullscreen}
          >
            <span>⛶</span>
          </button>

          <button
            className="pres-cta-btn subtle"
            id="pres-exit-btn"
            title="Return to Studio Editor Mode [Shortcut: P]"
            onClick={() => setAppMode('studio')}
          >
            <span>🛠️ Edit</span>
          </button>
        </div>
      </header>



      {/* Bottom Client Navigation Bar */}
      <footer className="pres-bottom-bar">
        {/* Interactive Architectural Blueprint Minimap Radar */}
        <MinimapRadar />

        {/* Room Viewpoint Bookmarks */}
        <div className="pres-bookmarks-container">
          <span className="pres-section-label">Room Vantage Points:</span>
          <div className="pres-bookmarks-list" id="pres-bookmarks-list" role="tablist">
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'entrance' ? 'active' : ''}`}
              id="bm-entrance"
              onClick={() => handleBookmarkClick('entrance')}
            >
              <span className="bm-icon">🚪</span>
              <span className="bm-name">Grand Entrance</span>
            </button>
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'salon' ? 'active' : ''}`}
              id="bm-salon"
              onClick={() => handleBookmarkClick('salon')}
            >
              <span className="bm-icon">🛋️</span>
              <span className="bm-name">Living Salon</span>
            </button>
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'kitchen' ? 'active' : ''}`}
              id="bm-kitchen"
              onClick={() => handleBookmarkClick('kitchen')}
            >
              <span className="bm-icon">🍳</span>
              <span className="bm-name">Chef's Island</span>
            </button>
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'suite' ? 'active' : ''}`}
              id="bm-suite"
              onClick={() => handleBookmarkClick('suite')}
            >
              <span className="bm-icon">🛏️</span>
              <span className="bm-name">Master Suite</span>
            </button>
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'terrace' ? 'active' : ''}`}
              id="bm-terrace"
              onClick={() => handleBookmarkClick('terrace')}
            >
              <span className="bm-icon">🌅</span>
              <span className="bm-name">Sunset Glazing</span>
            </button>
            <button
              className={`pres-bookmark-pill ${activeBookmark === 'dollhouse' ? 'active' : ''}`}
              id="bm-dollhouse"
              onClick={() => handleBookmarkClick('dollhouse')}
            >
              <span className="bm-icon">📐</span>
              <span className="bm-name">3D Dollhouse</span>
            </button>
          </div>
        </div>

        {/* Space Life Transformation Scenarios */}
        <div className="pres-scenarios-container">
          <span className="pres-section-label">Adaptive Life Mode:</span>
          <div className="pres-scenario-pills">
            {MODES.map((m, idx) => (
              <button
                key={m.num}
                className={`pres-scen-pill ${circadianIndex === idx ? 'active' : ''}`}
                id={`pres-scen-${m.name.toLowerCase()}`}
                onClick={() => {
                  setCircadianIndex(idx);
                  playChime(480 + idx * 60);
                }}
              >
                <span className="scen-dot" />
                <span>{m.name === 'Work' ? 'Morning Focus' : m.name === 'Cook' ? 'Culinary Social' : m.name === 'Entertain' ? 'Cinema Lounge' : 'Night Retreat'}</span>
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SpecModal />
      <TourDirectorModal />
    </div>
  );
}
