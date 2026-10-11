import React, { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  showAvatarsAtom,
  avatarCountAtom,
  avatarModeAtom,
  avatarSelectedTargetRoomAtom,
  showNavPathAtom,
  avatarStatusAtom,
  housePlanAtom
} from '../../store/atoms';
import { avatarManager } from '../../navigation/AvatarManager';
import { navigationEngine } from '../../navigation/navigationEngine';
import { playChime, playSwitch } from '../../audio/audioSystem';

export default function NavigationPeopleHud() {
  const [showAvatars, setShowAvatars] = useAtom(showAvatarsAtom);
  const [avatarCount, setAvatarCount] = useAtom(avatarCountAtom);
  const [avatarMode, setAvatarMode] = useAtom(avatarModeAtom);
  const [selectedTargetRoom, setSelectedTargetRoom] = useAtom(avatarSelectedTargetRoomAtom);
  const [showNavPath, setShowNavPath] = useAtom(showNavPathAtom);
  const [avatarStatus, setAvatarStatus] = useAtom(avatarStatusAtom);
  const housePlan = useAtomValue(housePlanAtom);

  const [isExpanded, setIsExpanded] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState([]);

  // Poll agent statuses for live HUD display
  useEffect(() => {
    const timer = setInterval(() => {
      if (avatarManager) {
        const statuses = avatarManager.getStatuses();
        setAgentStatuses(statuses);
        if (statuses.length > 0) {
          setAvatarStatus(statuses[0]);
        }
      }
    }, 250);
    return () => clearInterval(timer);
  }, [setAvatarStatus]);

  const handleToggleAvatars = () => {
    const next = !showAvatars;
    setShowAvatars(next);
    avatarManager.setVisible(next);
    playSwitch();
  };

  const handleSetCount = (count) => {
    setAvatarCount(count);
    avatarManager.setCount(count);
    playChime(540);
  };

  const handleTogglePathRibbon = () => {
    const next = !showNavPath;
    setShowNavPath(next);
    avatarManager.setShowPathRibbon(next);
    playSwitch();
  };

  const handleSendToRoom = (roomId) => {
    setSelectedTargetRoom(roomId);
    avatarManager.sendAllToRoom(roomId);
    playChime(660);
  };

  const roomsList = housePlan === 'villa' ? [
    { id: 'salon', name: 'Salon Lounge', icon: '🛋️', doorVia: 'Central Hall' },
    { id: 'kitchen', name: "Chef's Kitchen", icon: '🍳', doorVia: 'Via Doorway 1' },
    { id: 'suite', name: 'Master Suite', icon: '🛏️', doorVia: 'Via Doorway 2' },
    { id: 'terrace', name: 'Sunset Terrace', icon: '🌅', doorVia: 'Via Sliding Portal' }
  ] : housePlan === 'studio' ? [
    { id: 'living', name: 'Living Space', icon: '🛋️', doorVia: 'Main Zone' },
    { id: 'kitchenette', name: 'Kitchenette', icon: '🍳', doorVia: 'Pocket Door' },
    { id: 'terrace', name: 'Balcony', icon: '🌅', doorVia: 'Glass Portal' }
  ] : [
    { id: 'atelier', name: 'Atelier Studio', icon: '🎨', doorVia: 'North Passage' },
    { id: 'lounge', name: 'Platform Lounge', icon: '🛋️', doorVia: 'South Passage' },
    { id: 'terrace', name: 'Sky Deck', icon: '🌅', doorVia: 'Terrace Portal' }
  ];

  return (
    <div className={`nav-people-hud ${isExpanded ? 'expanded' : ''}`} id="nav-people-hud">
      {/* 1. Collapsed Floating Dock Bar */}
      <div className="nav-people-bar" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="nav-people-badge">
          <span className="nav-pulse-dot" />
          <span className="nav-badge-icon">👥</span>
          <span className="nav-badge-title">SPATIAL CROWD & DOORS</span>
        </div>

        <div className="nav-quick-status">
          <span className="nav-status-pill">
            {showAvatars ? `${avatarCount} Occupants Active` : 'Occupants Paused'}
          </span>
          <span className="nav-door-chip">🚪 Doors: Guided</span>
          <span className="nav-wall-chip">🧱 Walls & Furniture: Impassable</span>
          <span className="nav-guide-chip">⭐ VIP Guide: Sophia Active</span>
        </div>

        <button
          className="nav-expand-btn"
          title={isExpanded ? 'Collapse HUD' : 'Expand Navigation Controls'}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* 2. Expanded Control Panel */}
      {isExpanded && (
        <div className="nav-people-panel">
          <div className="nav-panel-header">
            <div>
              <div className="nav-panel-title">ARCHITECTURAL NAVIGATION ENGINE</div>
              <div className="nav-panel-subtitle">
                AI agents recognize doors, avoid solid walls & glass, and thread doorway portals.
              </div>
            </div>
            <button className="nav-close-btn" onClick={() => setIsExpanded(false)}>✕</button>
          </div>

          {/* Master Toggles */}
          <div className="nav-toggles-row">
            <button
              className={`nav-btn-toggle ${showAvatars ? 'active' : ''}`}
              onClick={handleToggleAvatars}
            >
              <span className="nav-btn-icon">{showAvatars ? '👁️' : '🕶️'}</span>
              <span>{showAvatars ? 'Occupants: VISIBLE' : 'Occupants: HIDDEN'}</span>
            </button>

            <button
              className={`nav-btn-toggle ${showNavPath ? 'active' : ''}`}
              onClick={handleTogglePathRibbon}
            >
              <span className="nav-btn-icon">✨</span>
              <span>{showNavPath ? 'Door Path Trail: ON' : 'Door Path Trail: OFF'}</span>
            </button>
          </div>

          {/* Occupant Count Selector */}
          <div className="nav-section">
            <div className="nav-section-label">OCCUPANT CROWD SIZE</div>
            <div className="nav-count-buttons">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  className={`nav-count-btn ${avatarCount === count && showAvatars ? 'active' : ''}`}
                  onClick={() => handleSetCount(count)}
                >
                  {count === 1 ? '1 Person (Architect)' : count === 2 ? '2 People (Client Duo)' : '3 People (Full Tour)'}
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch to Room via Doorways */}
          <div className="nav-section">
            <div className="nav-section-label">
              DISPATCH OCCUPANTS (PATHFINDS THROUGH DOORS)
            </div>
            <div className="nav-rooms-grid">
              {roomsList.map((room) => (
                <button
                  key={room.id}
                  className={`nav-room-card ${selectedTargetRoom === room.id ? 'active' : ''}`}
                  onClick={() => handleSendToRoom(room.id)}
                >
                  <span className="nav-room-icon">{room.icon}</span>
                  <div className="nav-room-info">
                    <span className="nav-room-name">{room.name}</span>
                    <span className="nav-room-via">{room.doorVia}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Agent Telemetry */}
          <div className="nav-telemetry">
            <div className="nav-telemetry-title">LIVE BIM SPATIAL TELEMETRY</div>
            {agentStatuses.map((st, i) => (
              <div key={i} className="nav-telemetry-row">
                <span className="telemetry-dot" />
                <span className="telemetry-text">{st}</span>
              </div>
            ))}
            <div className="nav-telemetry-meta">
              <span>Collision Rule: Walls, Furniture & Occupant Clearance (0.35m)</span>
              <span>•</span>
              <span>Doorway Portals: Permeable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
