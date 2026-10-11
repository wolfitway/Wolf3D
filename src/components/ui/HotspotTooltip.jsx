import React from 'react';
import { useAtomValue } from 'jotai';
import { hotspotTooltipAtom } from '../../store/atoms';

export default function HotspotTooltip() {
  const tooltip = useAtomValue(hotspotTooltipAtom);

  if (!tooltip) {
    return (
      <div id="hotspot-tooltip" className="hotspot-tooltip" style={{ display: 'none' }}>
        <div className="tooltip-title" id="tooltip-title">Material Spec</div>
        <div className="tooltip-meta" id="tooltip-meta">Click to inspect finish details</div>
      </div>
    );
  }

  return (
    <div
      id="hotspot-tooltip"
      className="hotspot-tooltip visible"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        display: 'block'
      }}
    >
      <div className="tooltip-title" id="tooltip-title">{tooltip.title}</div>
      <div className="tooltip-meta" id="tooltip-meta" dangerouslySetInnerHTML={{ __html: tooltip.kicker }} />
    </div>
  );
}
