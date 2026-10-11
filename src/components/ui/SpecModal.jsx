import React from 'react';
import { useAtom } from 'jotai';
import { activeSpecHotspotAtom } from '../../store/atoms';
import { playChime } from '../../audio/audioSystem';

export default function SpecModal() {
  const [activeSpec, setActiveSpec] = useAtom(activeSpecHotspotAtom);

  if (!activeSpec) return null;

  const handleClose = () => {
    setActiveSpec(null);
    playChime(350);
  };

  return (
    <div className="pres-spec-modal open" id="pres-spec-modal" role="dialog" aria-modal="true" aria-labelledby="spec-card-title">
      <div className="spec-modal-header">
        <div className="spec-modal-kicker" id="spec-card-kicker">{activeSpec.kicker || 'ARCHITECTURAL MATERIAL SPECIFICATION'}</div>
        <button className="spec-modal-close" id="spec-modal-close" aria-label="Close Material Card" onClick={handleClose}>
          &times;
        </button>
      </div>
      <div className="spec-modal-body">
        <h3 className="spec-card-title" id="spec-card-title">{activeSpec.title}</h3>
        <p className="spec-card-narrative" id="spec-card-narrative">
          {activeSpec.narrative}
        </p>
        <div className="spec-details-grid" id="spec-details-grid">
          <div className="spec-grid-item">
            <span className="grid-label">Provenance</span>
            <strong className="grid-value" id="spec-grid-prov">{activeSpec.prov}</strong>
          </div>
          <div className="spec-grid-item">
            <span className="grid-label">Finish / Sheen</span>
            <strong className="grid-value" id="spec-grid-finish">{activeSpec.finish}</strong>
          </div>
          <div className="spec-grid-item">
            <span className="grid-label">Acoustic / Thermal</span>
            <strong className="grid-value" id="spec-grid-thermal">{activeSpec.thermal}</strong>
          </div>
          <div className="spec-grid-item">
            <span className="grid-label">Sustainability</span>
            <strong className="grid-value" id="spec-grid-sustain" dangerouslySetInnerHTML={{ __html: activeSpec.sustain }} />
          </div>
        </div>
        <div className="spec-modal-actions">
          <button className="spec-action-btn primary" id="spec-focus-cam-btn" onClick={() => playChime(720)}>
            <span>🔭 Focus Camera On Spec</span>
          </button>
          <button className="spec-action-btn secondary" id="spec-dismiss-btn" onClick={handleClose}>
            <span>Close Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}
