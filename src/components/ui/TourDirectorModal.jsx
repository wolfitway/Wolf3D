import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  isTourDirectorOpenAtom,
  customTourMovesAtom,
  tourSpeedAtom,
  isTourActiveAtom,
  tourStopIndexAtom,
  housePlanAtom
} from '../../store/atoms';
import { TOUR_ROUTES, ROOM_BOOKMARKS } from '../../data/constants';
import { playChime } from '../../audio/audioSystem';

export default function TourDirectorModal() {
  const [isOpen, setIsOpen] = useAtom(isTourDirectorOpenAtom);
  const [customMoves, setCustomMoves] = useAtom(customTourMovesAtom);
  const [tourSpeed, setTourSpeed] = useAtom(tourSpeedAtom);
  const [isTourActive, setIsTourActive] = useAtom(isTourActiveAtom);
  const [, setTourStopIndex] = useAtom(tourStopIndexAtom);
  const housePlan = useAtomValue(housePlanAtom);

  if (!isOpen) return null;

  const currentRoute = customMoves.length > 0 ? customMoves : (TOUR_ROUTES[housePlan] || TOUR_ROUTES.villa);

  const handleCaptureMove = () => {
    const num = currentRoute.length + 1;
    const newMove = {
      title: `VIP Viewpoint #${num}`,
      desc: `Custom architectural camera angle #${num}.`,
      duration: 3.5,
      pos: [0, 2.0, 3.0],
      target: [0, 1.2, 0]
    };
    setCustomMoves([...currentRoute, newMove]);
    playChime(880);
  };

  const handleDeleteMove = (index) => {
    const updated = currentRoute.filter((_, i) => i !== index);
    setCustomMoves(updated);
    playChime(350);
  };

  const handlePlayTour = () => {
    setIsOpen(false);
    setTourStopIndex(0);
    setIsTourActive(true);
    playChime(700);
  };

  const handleReset = () => {
    const defaultRoute = TOUR_ROUTES[housePlan] || TOUR_ROUTES.villa;
    setCustomMoves(defaultRoute);
    playChime(440);
  };

  return (
    <div className="tour-director-modal visible open" id="tour-director-modal" role="dialog" aria-modal="true">
      <div className="tour-dir-header">
        <div className="tour-dir-title-group">
          <span className="tour-dir-kicker">WOLFITWAY PRESENTATION ENGINE</span>
          <h3>VIP Tour Director & Custom Moves</h3>
        </div>
        <button className="close-btn" id="close-tour-dir-btn" onClick={() => setIsOpen(false)}>
          &times;
        </button>
      </div>
      <div className="tour-dir-body">
        <div className="tour-capture-bar">
          <button className="pres-cta-btn highlight" id="btn-capture-move" onClick={handleCaptureMove}>
            <span>➕ Capture Current View as Move</span>
          </button>
          <span className="capture-hint">Navigate camera anywhere in 3D, then click to add as a tour move!</span>
        </div>

        <div className="tour-speed-row">
          <span className="speed-label">Tour Pace:</span>
          <div className="pill-group">
            <button
              className={`pill-btn ${tourSpeed === 0.6 ? 'active' : ''}`}
              id="speed-slow"
              onClick={() => setTourSpeed(0.6)}
            >
              Cinematic (Slow)
            </button>
            <button
              className={`pill-btn ${tourSpeed === 1.0 ? 'active' : ''}`}
              id="speed-normal"
              onClick={() => setTourSpeed(1.0)}
            >
              Standard
            </button>
            <button
              className={`pill-btn ${tourSpeed === 1.5 ? 'active' : ''}`}
              id="speed-fast"
              onClick={() => setTourSpeed(1.5)}
            >
              Dynamic (Brisk)
            </button>
          </div>
        </div>

        <div className="tour-moves-list" id="tour-moves-list">
          {currentRoute.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9d958c', fontSize: '0.85rem' }}>
              No moves in tour sequence. Click "Capture Current View as Move" above to add waypoints!
            </div>
          ) : (
            currentRoute.map((move, idx) => (
              <div key={idx} className="tour-move-card">
                <div className="move-index-badge">{idx + 1}</div>
                <div className="move-info">
                  <input
                    type="text"
                    className="move-name-input"
                    value={move.title}
                    onChange={(e) => {
                      const updated = [...currentRoute];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setCustomMoves(updated);
                    }}
                    placeholder="Move name"
                  />
                  <div className="move-coords">{move.desc || `${move.duration || 3.5}s duration`}</div>
                </div>
                <div className="move-actions">
                  <button
                    className="move-act-btn preview"
                    title="Preview this vantage point"
                    onClick={() => playChime(580)}
                  >
                    🔭 View
                  </button>
                  <button
                    className="move-act-btn update"
                    title="Update move"
                    onClick={() => playChime(784)}
                  >
                    📷 Update
                  </button>
                  <button
                    className="move-act-btn delete"
                    title="Delete move"
                    onClick={() => handleDeleteMove(idx)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="tour-dir-footer">
          <button className="pres-cta-btn highlight" id="btn-play-custom-tour" onClick={handlePlayTour}>
            <span>▶️ Play Custom VIP Tour</span>
          </button>
          <button className="ctrl-btn" id="btn-reset-default-tour" onClick={handleReset}>
            <span>↺ Reset to Signature Moves</span>
          </button>
        </div>
      </div>
    </div>
  );
}
