import React, { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  selectedPropIdAtom,
  selectedPropAtom,
  spawnedPropsAtom,
  roomDimensionsAtom,
  isGrabbingPropAtom,
  grabAxisLockAtom,
  placementValidAtom,
  placementReasonAtom,
  isStructuralLockedAtom,
  lockedElementIdsAtom,
  structuralElementsAtom
} from '../../store/atoms';
import { physicsEngine } from '../../physics/physicsEngine';
import { playChime, playSnap, playDrawerSlide } from '../../audio/audioSystem';
import { PROPS_META, STRUCTURAL_META } from '../../data/constants';
import * as THREE from 'three';

export default function ItemTransformHud() {
  const [selectedPropId, setSelectedPropId] = useAtom(selectedPropIdAtom);
  const selectedProp = useAtomValue(selectedPropAtom);
  const [spawnedProps, setSpawnedProps] = useAtom(spawnedPropsAtom);
  const roomDimensions = useAtomValue(roomDimensionsAtom);
  const [isGrabbingProp, setIsGrabbingProp] = useAtom(isGrabbingPropAtom);
  const [grabAxisLock, setGrabAxisLock] = useAtom(grabAxisLockAtom);
  const placementValid = useAtomValue(placementValidAtom);
  const placementReason = useAtomValue(placementReasonAtom);
  const [isStructuralLocked, setIsStructuralLocked] = useAtom(isStructuralLockedAtom);
  const [lockedElementIds, setLockedElementIds] = useAtom(lockedElementIdsAtom);
  const [structuralElements, setStructuralElements] = useAtom(structuralElementsAtom);
  const [areDrawersOpen, setAreDrawersOpen] = useState(false);

  const isStructural = selectedProp ? (selectedProp.isStructural || selectedProp.id?.startsWith('struct-')) : false;
  const isLocked = selectedProp ? (selectedProp.isLocked || lockedElementIds.includes(selectedProp.id)) : false;

  const propMeta = selectedProp ? (PROPS_META[selectedProp.type] || {}) : {};
  const structMeta = selectedProp ? (STRUCTURAL_META[selectedProp.id] || {}) : {};
  const meta = isStructural ? structMeta : propMeta;
  const hasDrawers = propMeta.hasDrawers || (selectedProp && (selectedProp.type?.includes('drawer') || selectedProp.type?.includes('cred')));

  // Reset drawer state when selection changes
  useEffect(() => {
    setAreDrawersOpen(false);
  }, [selectedPropId]);

  // Keyboard shortcut: L to toggle lock
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'l' || e.key === 'L') && selectedPropId) {
        e.preventDefault();
        handleToggleLock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPropId, lockedElementIds, isStructuralLocked]);

  if (!selectedProp) return null;

  const handleToggleLock = () => {
    if (!selectedPropId) return;
    const isCurrentlyLocked = lockedElementIds.includes(selectedPropId);
    let nextLockedList;
    if (isCurrentlyLocked) {
      nextLockedList = lockedElementIds.filter(id => id !== selectedPropId);
      playChime(720);
    } else {
      nextLockedList = [...lockedElementIds, selectedPropId];
      playChime(380);
    }
    setLockedElementIds(nextLockedList);

    // If grabbing while locked, cancel grab
    if (!isCurrentlyLocked && isGrabbingProp && window.__wolfCancelGrab) {
      window.__wolfCancelGrab();
    }
  };

  const handleRotate = () => {
    if (isLocked) {
      playChime(320);
      return;
    }

    if (isStructural) {
      if (window.__wolfRotateStructural) {
        window.__wolfRotateStructural(selectedPropId, Math.PI / 4);
      }
      playChime(740);
      return;
    }

    const record = physicsEngine.physicsObjects.get(selectedPropId);
    if (!record || !record.body) return;
    const curRot = record.body.rotation();
    const curQ = new THREE.Quaternion(curRot.x, curRot.y, curRot.z, curRot.w);
    const rotStep = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    curQ.multiply(rotStep);
    record.body.setRotation({ x: curQ.x, y: curQ.y, z: curQ.z, w: curQ.w }, true);
    playChime(740);
  };

  const handleNudge = (dx, dz) => {
    if (isLocked) {
      playChime(320);
      return;
    }

    if (isStructural) {
      if (window.__wolfMoveStructural) {
        window.__wolfMoveStructural(selectedPropId, dx, dz);
      }
      playSnap();
      return;
    }

    const record = physicsEngine.physicsObjects.get(selectedPropId);
    if (!record || !record.body) return;
    const t = record.body.translation();
    const halfW = roomDimensions.width / 2 - 0.45;
    const halfD = roomDimensions.depth / 2 - 0.45;
    const nextX = Math.max(-halfW, Math.min(halfW, t.x + dx));
    const nextZ = Math.max(-halfD, Math.min(halfD, t.z + dz));

    record.body.setTranslation({ x: nextX, y: t.y, z: nextZ }, true);
    record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    record.body.wakeUp();

    setSpawnedProps(prev =>
      prev.map(p => (p.id === selectedPropId ? { ...p, x: nextX, z: nextZ } : p))
    );
    playSnap();
  };

  const handleToggleGrab = () => {
    if (isLocked) {
      playChime(320);
      return;
    }

    if (isGrabbingProp) {
      if (window.__wolfSettleProp) window.__wolfSettleProp(selectedPropId);
    } else {
      if (window.__wolfGrabProp) window.__wolfGrabProp(selectedPropId);
    }
  };

  const handleSettle = () => {
    if (isLocked) return;
    if (window.__wolfSettleProp) {
      window.__wolfSettleProp(selectedPropId);
    } else {
      handleDrop();
    }
  };

  const handleToggleAxis = (axis) => {
    if (window.__wolfToggleAxisLock) {
      window.__wolfToggleAxisLock(axis);
    }
  };

  const handleToggleDrawers = () => {
    if (window.__wolfToggleDrawers) {
      const nextOpen = window.__wolfToggleDrawers(selectedPropId);
      setAreDrawersOpen(nextOpen);
    } else {
      setAreDrawersOpen(prev => !prev);
    }
    playDrawerSlide();
  };

  const handleDrop = () => {
    if (isLocked || isStructural) return;
    const record = physicsEngine.physicsObjects.get(selectedPropId);
    if (!record || !record.body) return;
    record.body.setLinvel({ x: 0, y: -0.9, z: 0 }, true);
    record.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    record.body.wakeUp();
    playChime(440);
  };

  const handleDuplicate = () => {
    if (isLocked) {
      playChime(320);
      return;
    }
    if (isStructural) {
      playChime(440);
      return;
    }

    const record = physicsEngine.physicsObjects.get(selectedPropId);
    if (!record || !record.body) return;
    const t = record.body.translation();
    const halfW = roomDimensions.width / 2 - 0.55;
    const halfD = roomDimensions.depth / 2 - 0.55;
    const newX = Math.max(-halfW, Math.min(halfW, t.x + 0.6));
    const newZ = Math.max(-halfD, Math.min(halfD, t.z + 0.6));
    const newId = `prop-${Date.now()}`;

    const newRecord = physicsEngine.createBody(newId, selectedProp.type, newX, t.y + 0.35, newZ);
    if (newRecord) {
      setSpawnedProps(prev => [
        ...prev,
        { id: newId, type: selectedProp.type, name: selectedProp.name, x: newX, y: t.y + 0.35, z: newZ }
      ]);
      setSelectedPropId(newId);
      playChime(784);
    }
  };

  const handleDelete = () => {
    if (isLocked) {
      playChime(320);
      return;
    }
    if (isStructural) {
      if (window.__wolfHideStructural) {
        window.__wolfHideStructural(selectedPropId);
      }
      setSelectedPropId(null);
      playChime(330);
      return;
    }

    physicsEngine.removeBody(selectedPropId);
    setSpawnedProps(prev => prev.filter(p => p.id !== selectedPropId));
    setSelectedPropId(null);
    playChime(330);
  };

  const handleDeselect = () => {
    if (isGrabbingProp && window.__wolfCancelGrab) {
      window.__wolfCancelGrab();
    } else {
      setSelectedPropId(null);
    }
  };

  return (
    <div id="item-transform-hud" className={`item-transform-hud visible active ${isGrabbingProp ? 'in-grab-mode' : ''} ${isLocked ? 'is-locked-entity' : ''}`}>
      <div className="hud-item-header">
        <div className="hud-badge-row">
          <span className="hud-badge">{isStructural ? '🏛️ ARCHICAD BIM ELEMENT' : '🪑 FURNITURE & JOINERY'}</span>
          <button
            className={`hud-lock-pill ${isLocked ? 'locked' : 'unlocked'}`}
            id="hud-lock-badge-btn"
            title="Toggle Lock / Freeze [Shortcut: L]"
            onClick={handleToggleLock}
          >
            <span>{isLocked ? '🔒 LOCKED' : '🔓 MOVABLE'}</span>
          </button>
          <span className={`hud-clearance-pill ${placementValid ? 'valid' : 'invalid'}`}>
            {placementValid ? '✓ 1:1 Metric Clearance' : `⚠ ${placementReason}`}
          </span>
        </div>
        <span className="hud-item-title" id="hud-item-name">{selectedProp.name || 'Selected Element'}</span>
        {(() => {
          const dimStr = typeof selectedProp.dimensions === 'object' && selectedProp.dimensions
            ? `${selectedProp.dimensions.width?.toFixed(2)}m × ${selectedProp.dimensions.depth?.toFixed(2)}m × ${selectedProp.dimensions.height?.toFixed(2)}m`
            : (meta.dimensions || selectedProp.dimensionsText || selectedProp.dimensions);
          const matStr = meta.material || selectedProp.material || 'Artisan Material';
          if (!dimStr && !matStr) return null;
          return (
            <span className="hud-item-submeta">
              {dimStr ? `${dimStr} • ` : ''}{matStr}
            </span>
          );
        })()}
      </div>

      {isLocked && (
        <div className="hud-locked-warning-bar">
          <span>🔒 Element is locked in place. Click Unlock or press <strong>[L]</strong> to move, rotate, or slide.</span>
        </div>
      )}

      <div className="hud-item-actions">
        {/* Lock / Unlock Toggle Button */}
        <button
          className={`hud-act-btn lock-btn ${isLocked ? 'is-locked' : 'is-unlocked'}`}
          id="hud-lock-btn"
          title="Toggle Lock / Freeze State [Shortcut: L]"
          onClick={handleToggleLock}
        >
          <span>{isLocked ? '🔓' : '🔒'}</span>
          <span>{isLocked ? 'Unlock [L]' : 'Lock [L]'}</span>
        </button>

        {/* Blender Grab / Move across floor */}
        <button
          className={`hud-act-btn grab-btn ${isGrabbingProp ? 'active' : ''} ${isLocked ? 'disabled' : ''}`}
          id="hud-grab-btn"
          disabled={isLocked}
          title={isLocked ? 'Element is locked • Press L to unlock' : 'Grab and Move piece across floor like in Blender [Shortcut: G]'}
          onClick={handleToggleGrab}
        >
          <span>🖐️</span>
          <span>{isGrabbingProp ? 'Drop Here' : 'Grab & Move [G]'}</span>
        </button>

        {/* Settle to floor or surface */}
        <button
          className={`hud-act-btn settle-btn ${isLocked ? 'disabled' : ''}`}
          id="hud-settle-btn"
          disabled={isLocked}
          title="Settle Down Firmly to Floor or Supporting Table [Shortcut: S / Space]"
          onClick={handleSettle}
        >
          <span>⬇️</span>
          <span>Settle Down [S]</span>
        </button>

        {/* Rotate 45° */}
        <button
          className={`hud-act-btn ${isLocked ? 'disabled' : ''}`}
          id="hud-rotate-btn"
          disabled={isLocked}
          title="Rotate 45° [Shortcut: R]"
          onClick={handleRotate}
        >
          <span>🔄</span> <span>Rotate [R]</span>
        </button>

        {/* Axis Locks (while in Grab mode) */}
        {isGrabbingProp && (
          <div className="hud-axis-group">
            <button
              className={`hud-act-btn axis-btn x-axis ${grabAxisLock === 'x' ? 'active' : ''}`}
              title="Lock movement along X axis [Shortcut: X]"
              onClick={() => handleToggleAxis('x')}
            >
              <span className="axis-dot red">●</span> <span>Lock X</span>
            </button>
            <button
              className={`hud-act-btn axis-btn z-axis ${grabAxisLock === 'z' ? 'active' : ''}`}
              title="Lock movement along Z axis [Shortcut: Z]"
              onClick={() => handleToggleAxis('z')}
            >
              <span className="axis-dot blue">●</span> <span>Lock Z</span>
            </button>
          </div>
        )}

        {/* Drawers slide action */}
        {hasDrawers && !isLocked && (
          <button
            className={`hud-act-btn drawer-btn ${areDrawersOpen ? 'active' : ''}`}
            id="hud-drawers-btn"
            title="Open / Close Drawers [Shortcut: O]"
            onClick={handleToggleDrawers}
          >
            <span>🗄️</span>
            <span>{areDrawersOpen ? 'Push In' : 'Slide Out'}</span>
          </button>
        )}

        {/* Nudge Directional Controls */}
        <div className={`hud-nudge-group ${isLocked ? 'disabled' : ''}`}>
          <button className="hud-nudge-btn" disabled={isLocked} title="Slide Left [Arrow Left / A]" onClick={() => handleNudge(-0.35, 0)}>
            <span>←</span>
          </button>
          <button className="hud-nudge-btn" disabled={isLocked} title="Slide Forward [Arrow Up / W]" onClick={() => handleNudge(0, -0.35)}>
            <span>↑</span>
          </button>
          <button className="hud-nudge-btn" disabled={isLocked} title="Slide Back [Arrow Down / S]" onClick={() => handleNudge(0, 0.35)}>
            <span>↓</span>
          </button>
          <button className="hud-nudge-btn" disabled={isLocked} title="Slide Right [Arrow Right / D]" onClick={() => handleNudge(0.35, 0)}>
            <span>→</span>
          </button>
        </div>

        {/* Duplicate */}
        {!isStructural && (
          <button
            className={`hud-act-btn ${isLocked ? 'disabled' : ''}`}
            id="hud-duplicate-btn"
            disabled={isLocked}
            title="Duplicate [Shortcut: D]"
            onClick={handleDuplicate}
          >
            <span>📋</span> <span>Duplicate</span>
          </button>
        )}

        {/* Delete / Hide */}
        <button
          className={`hud-act-btn danger ${isLocked ? 'disabled' : ''}`}
          id="hud-delete-btn"
          disabled={isLocked}
          title={isStructural ? 'Hide Structural Element' : 'Delete Prop [Shortcut: Del]'}
          onClick={handleDelete}
        >
          <span>🗑️</span> <span>{isStructural ? 'Hide' : 'Remove'}</span>
        </button>

        {/* Close / Deselect */}
        <button className="hud-act-btn close" id="hud-deselect-btn" title="Deselect / Cancel [Shortcut: Esc]" onClick={handleDeselect}>
          <span>✕</span>
        </button>
      </div>
    </div>
  );
}

