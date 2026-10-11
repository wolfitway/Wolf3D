import React from 'react';
import { useAtomValue } from 'jotai';
import {
  isGrabbingPropAtom,
  grabAxisLockAtom,
  placementValidAtom,
  placementReasonAtom,
  selectedPropAtom
} from '../../store/atoms';

export default function BlenderGrabBanner() {
  const isGrabbing = useAtomValue(isGrabbingPropAtom);
  const axisLock = useAtomValue(grabAxisLockAtom);
  const isValid = useAtomValue(placementValidAtom);
  const reason = useAtomValue(placementReasonAtom);
  const selectedProp = useAtomValue(selectedPropAtom);

  if (!isGrabbing) return null;

  return (
    <div id="blender-grab-banner" className="blender-grab-banner visible">
      <div className="banner-left">
        <span className="banner-mode-pill">BLENDER GRAB &amp; MOVE</span>
        <span className="banner-item-name">{selectedProp?.name || 'Architectural Object'}</span>
        <span className={`banner-status-pill ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? '✓ CLEAR PLACEMENT ZONE' : `⚠ ${reason.toUpperCase()}`}
        </span>
      </div>

      <div className="banner-shortcuts">
        <div className="shortcut-chip">
          <kbd>Mouse</kbd>
          <span>Glide</span>
        </div>
        <div
          className={`shortcut-chip ${axisLock === 'x' ? 'locked x' : ''}`}
          onClick={() => window.__wolfToggleAxisLock && window.__wolfToggleAxisLock('x')}
          title="Click or press X to toggle X-axis lock"
        >
          <kbd>X</kbd>
          <span>{axisLock === 'x' ? '🔴 X-LOCKED' : 'Lock X'}</span>
        </div>
        <div
          className={`shortcut-chip ${axisLock === 'z' ? 'locked z' : ''}`}
          onClick={() => window.__wolfToggleAxisLock && window.__wolfToggleAxisLock('z')}
          title="Click or press Z to toggle Z-axis lock"
        >
          <kbd>Z</kbd>
          <span>{axisLock === 'z' ? '🔵 Z-LOCKED' : 'Lock Z'}</span>
        </div>
        <div
          className="shortcut-chip"
          onClick={() => {
            if (selectedProp && window.__wolfGrabProp) {
              const e = new KeyboardEvent('keydown', { key: 'r' });
              window.dispatchEvent(e);
            }
          }}
          title="Click or press R to rotate 45°"
        >
          <kbd>R</kbd>
          <span>Rotate 45°</span>
        </div>
        <div
          className="shortcut-chip action-settle"
          onClick={() => selectedProp && window.__wolfSettleProp && window.__wolfSettleProp(selectedProp.id)}
          title="Click or press Space to settle down"
        >
          <kbd>Space / Click</kbd>
          <span>Settle Down</span>
        </div>
        <div
          className="shortcut-chip action-cancel"
          onClick={() => window.__wolfCancelGrab && window.__wolfCancelGrab()}
          title="Click or press Esc to cancel"
        >
          <kbd>Esc</kbd>
          <span>Cancel</span>
        </div>
      </div>
    </div>
  );
}
