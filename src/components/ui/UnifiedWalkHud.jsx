import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  cameraViewAtom,
  isTourActiveAtom,
  isTourPausedAtom,
  tourStopIndexAtom,
  tourProgressAtom,
  tourSpeedAtom,
  housePlanAtom,
  isLetterboxAtom,
  isTourDirectorOpenAtom
} from '../../store/atoms';
import { TOUR_ROUTES, ROOM_BOOKMARKS } from '../../data/constants';
import { playChime } from '../../audio/audioSystem';
import { avatarManager } from '../../navigation/AvatarManager';

export default function UnifiedWalkHud() {
  const [cameraView, setCameraView] = useAtom(cameraViewAtom);
  const [isTourActive, setIsTourActive] = useAtom(isTourActiveAtom);
  const [isTourPaused, setIsTourPaused] = useAtom(isTourPausedAtom);
  const [tourStopIndex, setTourStopIndex] = useAtom(tourStopIndexAtom);
  const tourProgress = useAtomValue(tourProgressAtom);
  const [tourSpeed, setTourSpeed] = useAtom(tourSpeedAtom);
  const housePlan = useAtomValue(housePlanAtom);
  const [isLetterbox, setIsLetterbox] = useAtom(isLetterboxAtom);
  const setIsTourDirectorOpen = useSetAtom(isTourDirectorOpenAtom);

  const [guideInfo, setGuideInfo] = React.useState(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      if (avatarManager) {
        setGuideInfo(avatarManager.getGuideInfo());
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const isVisible = cameraView === 'walk' || isTourActive;
  if (!isVisible) return null;

  const currentRoute = TOUR_ROUTES[housePlan] || TOUR_ROUTES.villa;
  const currentStop = currentRoute[tourStopIndex] || currentRoute[0];

  const handleToggleAutopilot = () => {
    if (!isTourActive) {
      setIsTourActive(true);
      setIsTourPaused(false);
      setCameraView('walk');
      if (avatarManager) {
        avatarManager.guideTourStop(currentStop, housePlan);
      }
      playChime(660);
    } else {
      setIsTourPaused(!isTourPaused);
      playChime(isTourPaused ? 660 : 440);
    }
  };

  const handleNextStop = () => {
    const nextIdx = (tourStopIndex + 1) % currentRoute.length;
    setTourStopIndex(nextIdx);
    const stop = currentRoute[nextIdx];
    if (stop && stop.key && window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark(stop.key);
    }
    if (avatarManager && stop) {
      avatarManager.guideTourStop(stop, housePlan);
    }
    playChime(580);
  };

  const handleRoomJump = (roomKey) => {
    // Find index in tour route if exists
    const idx = currentRoute.findIndex(r => r.key === roomKey);
    if (idx !== -1) {
      setTourStopIndex(idx);
    }
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark(roomKey);
    }
    if (avatarManager) {
      const stop = currentRoute.find(r => r.key === roomKey) || { key: roomKey, title: roomKey, desc: roomKey };
      avatarManager.guideTourStop(stop, housePlan);
    }
    setCameraView('walk');
    playChime(620);
  };

  const handleExitWalk = () => {
    setIsTourActive(false);
    setIsTourPaused(false);
    setCameraView('overall');
    playChime(440);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.5, 2.0];
    const curIdx = speeds.indexOf(tourSpeed);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    setTourSpeed(nextSpeed);
    playChime(520);
  };

  const roomBookmarks = [
    { key: 'entrance', icon: '🚪', label: 'Grand Arrival' },
    { key: 'salon', icon: '🛋️', label: 'Living Salon' },
    { key: 'kitchen', icon: '🍳', label: "Chef's Island" },
    { key: 'suite', icon: '🛏️', label: 'Master Suite' },
    { key: 'terrace', icon: '🌅', label: 'Sunset Terrace' },
    { key: 'dollhouse', icon: '🏛️', label: '3D Overview' }
  ];

  return (
    <div className="unified-walk-container visible" id="unified-walk-hud">
      {/* 1. TOP CINEMATIC WALK & AUTOPILOT HUD */}
      <div className="unified-walk-top-bar">
        {/* Left: Mode Badge */}
        <div className="walk-status-pill">
          {isTourActive && !isTourPaused ? (
            <>
              <span className="record-dot pulse" />
              <span className="status-label">AUTOPILOT TOUR &bull; STOP {tourStopIndex + 1}/{currentRoute.length}</span>
            </>
          ) : (
            <>
              <span className="walk-active-dot" />
              <span className="status-label">FREE FIRST-PERSON WALK</span>
            </>
          )}
        </div>

        {/* Center: Live Room Title, Narrative & VIP Tour Guide Sophia */}
        <div className="walk-narrative-card">
          <div className="walk-narrative-header">
            <h3 className="walk-narrative-title">{currentStop.title}</h3>
            <div className="walk-guide-chip" title="Sophia (Lead Architect) is guiding our VIP Tour">
              <span className="guide-chip-star">⭐</span>
              <span className="guide-chip-text">VIP Guide: Sophia</span>
            </div>
          </div>
          <p className="walk-narrative-desc">{currentStop.desc}</p>
          {guideInfo && guideInfo.speech && (
            <div className="walk-guide-speech">
              <span className="guide-speech-icon">🎙️</span>
              <span className="guide-speech-text">"{guideInfo.speech}"</span>
            </div>
          )}
          {isTourActive && (
            <div className="walk-progress-track">
              <div className="walk-progress-fill" style={{ width: `${tourProgress}%` }} />
            </div>
          )}
        </div>

        {/* Right: Master Control Actions */}
        <div className="walk-actions-cluster">
          <button
            className="walk-ctrl-btn guide-btn"
            id="walk-focus-guide-btn"
            title="Focus Camera on VIP Tour Guide Sophia"
            onClick={() => {
              if (avatarManager) {
                const info = avatarManager.getGuideInfo();
                if (info && info.position && window.__wolfLookAtPos) {
                  window.__wolfLookAtPos(info.position.x, 1.4, info.position.z);
                  playChime(750);
                }
              }
            }}
          >
            <span className="ctrl-icon">👩‍💼</span>
            <span className="ctrl-text">Guide</span>
          </button>

          <button
            className={`walk-ctrl-btn ${isTourActive && !isTourPaused ? 'active' : 'highlight'}`}
            id="walk-autopilot-btn"
            title="Toggle Guided Autopilot Tour [Shortcut: Space]"
            onClick={handleToggleAutopilot}
          >
            <span className="ctrl-icon">{isTourActive && !isTourPaused ? '⏸️' : '▶️'}</span>
            <span className="ctrl-text">{isTourActive && !isTourPaused ? 'Pause Autopilot' : 'Autopilot Tour'}</span>
          </button>

          <button
            className="walk-ctrl-btn"
            id="walk-next-btn"
            title="Jump to Next Room Waypoint"
            onClick={handleNextStop}
          >
            <span className="ctrl-icon">⏭️</span>
            <span className="ctrl-text">Next</span>
          </button>

          <button
            className="walk-ctrl-btn"
            id="walk-speed-btn"
            title="Cycle Gliding Speed"
            onClick={cycleSpeed}
          >
            <span className="ctrl-text">{tourSpeed}x</span>
          </button>

          <button
            className="walk-ctrl-btn"
            id="walk-director-btn"
            title="Custom Tour Moves Director"
            onClick={() => setIsTourDirectorOpen(true)}
          >
            <span className="ctrl-icon">🎬</span>
            <span className="ctrl-text">Director</span>
          </button>

          <button
            className={`walk-ctrl-btn ${isLetterbox ? 'active' : ''}`}
            id="walk-letterbox-btn"
            title="Toggle 2.39:1 Anamorphic Cinema Letterbox [Shortcut: C]"
            onClick={() => setIsLetterbox(!isLetterbox)}
          >
            <span className="ctrl-icon">🎞️</span>
          </button>

          <button
            className="walk-ctrl-btn exit"
            id="walk-exit-btn"
            title="Exit Walkthrough Mode [Shortcut: Esc]"
            onClick={handleExitWalk}
          >
            <span className="ctrl-icon">&times;</span>
            <span className="ctrl-text">Exit</span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM ROOM QUICK-JUMP STRIP & WASD CONTROLS HINT */}
      <div className="unified-walk-bottom-bar">
        {/* Navigation Room Pills */}
        <div className="walk-room-pills">
          <span className="pills-label">Glide To Room:</span>
          {roomBookmarks.map(bm => (
            <button
              key={bm.key}
              className={`walk-room-pill ${currentStop.key === bm.key ? 'active' : ''}`}
              id={`walk-pill-${bm.key}`}
              onClick={() => handleRoomJump(bm.key)}
            >
              <span className="pill-icon">{bm.icon}</span>
              <span className="pill-name">{bm.label}</span>
            </button>
          ))}
        </div>

        {/* Free-Walking Keys Reminder */}
        <div className="walk-keys-guide">
          <span className="keys-group">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Walk
          </span>
          <span className="keys-group">
            <kbd>Drag</kbd> Look
          </span>
          <span className="keys-group">
            <kbd>Space</kbd> Autopilot
          </span>
          <span className="keys-group">
            <kbd>Esc</kbd> Exit
          </span>
        </div>
      </div>
    </div>
  );
}
