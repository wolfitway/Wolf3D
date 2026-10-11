import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { appModeAtom, activeDrawerAtom, selectedPropIdAtom, cameraViewAtom, isTourActiveAtom } from '../../store/atoms';
import { playChime } from '../../audio/audioSystem';

export default function MasterModeSwitcher() {
  const [appMode, setAppMode] = useAtom(appModeAtom);
  const setActiveDrawer = useSetAtom(activeDrawerAtom);
  const setSelectedPropId = useSetAtom(selectedPropIdAtom);
  const setCameraView = useSetAtom(cameraViewAtom);
  const setIsTourActive = useSetAtom(isTourActiveAtom);

  const handleModeChange = (newMode) => {
    if (appMode === newMode) return;
    setAppMode(newMode);
    setActiveDrawer(null);
    setSelectedPropId(null);
    playChime(newMode === 'presentation' ? 620 : 440);

    if (newMode === 'studio') {
      setIsTourActive(false);
      setCameraView('overall');
    } else {
      // Presentation mode: set overall or grand entrance
      setCameraView('overall');
    }
  };

  return (
    <div className="master-mode-switcher-bar">
      <div className="master-mode-switcher" id="master-mode-switcher" role="radiogroup" aria-label="Engine Mode">
        <button
          className={`master-mode-pill ${appMode === 'studio' ? 'active' : ''}`}
          id="btn-mode-studio"
          title="Studio Editor: Configure layout, dimensions, materials, and arrange props [Shortcut: P]"
          onClick={() => handleModeChange('studio')}
        >
          <span className="pill-status-dot" />
          <span className="pill-icon">🛠️</span>
          <span className="pill-label">Studio Editor</span>
          <span className="pill-shortcut">P</span>
        </button>
        <button
          className={`master-mode-pill ${appMode === 'presentation' ? 'active' : ''}`}
          id="btn-mode-presentation"
          title="Client Presentation: Distraction-free architectural showcase, mood lighting & VIP walkthrough [Shortcut: P]"
          onClick={() => handleModeChange('presentation')}
        >
          <span className="pill-status-dot" />
          <span className="pill-icon">🐺</span>
          <span className="pill-label">VIP Showcase</span>
          <span className="pill-tag">VIP</span>
          <span className="pill-shortcut">P</span>
        </button>
      </div>
    </div>
  );
}
