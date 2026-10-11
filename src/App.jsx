import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  appModeAtom,
  isLetterboxAtom,
  isAudioEnabledAtom,
  isTourActiveAtom,
  isTourPausedAtom,
  selectedPropIdAtom,
  cameraViewAtom
} from './store/atoms';
import { setAudioMute, playChime } from './audio/audioSystem';

import HouseScene from './components/canvas/HouseScene';
import CinematicLetterbox from './components/ui/CinematicLetterbox';
import UnifiedWalkHud from './components/ui/UnifiedWalkHud';
import SnapshotFlash from './components/ui/SnapshotFlash';
import HotspotTooltip from './components/ui/HotspotTooltip';
import ItemTransformHud from './components/ui/ItemTransformHud';
import BlenderGrabBanner from './components/ui/BlenderGrabBanner';
import MasterModeSwitcher from './components/ui/MasterModeSwitcher';
import StudioUi from './components/ui/StudioUi';
import PresentationUi from './components/ui/PresentationUi';
import CatalogDrawer from './components/ui/CatalogDrawer';
import CadDrawer from './components/ui/CadDrawer';
import BudgetDrawer from './components/ui/BudgetDrawer';
import InfoDrawer from './components/ui/InfoDrawer';
import DrawerBackdrop from './components/ui/DrawerBackdrop';
import DossierModal from './components/ui/DossierModal';
import ArchicadPlanHud from './components/ui/ArchicadPlanHud';
import ImageTo3dModal from './components/ui/ImageTo3dModal';

export default function App() {
  const [appMode, setAppMode] = useAtom(appModeAtom);
  const [isLetterbox, setIsLetterbox] = useAtom(isLetterboxAtom);
  const [isAudioEnabled, setIsAudioEnabled] = useAtom(isAudioEnabledAtom);
  const [isTourActive, setIsTourActive] = useAtom(isTourActiveAtom);
  const [isTourPaused, setIsTourPaused] = useAtom(isTourPausedAtom);
  const setSelectedPropId = useSetAtom(selectedPropIdAtom);
  const setCameraView = useSetAtom(cameraViewAtom);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Space: Settle prop in Studio mode, or toggle Tour Play/Pause in Presentation mode
      if (e.code === 'Space') {
        if (appMode === 'studio' && selectedPropId) {
          e.preventDefault();
          if (window.__wolfSettleProp) {
            window.__wolfSettleProp(selectedPropId);
          }
          return;
        }

        e.preventDefault();
        if (isTourActive) {
          setIsTourPaused(!isTourPaused);
        } else {
          setIsTourActive(true);
        }
      }

      // C: Toggle Cinema Anamorphic 2.39:1 Letterbox
      if (e.key === 'c' || e.key === 'C') {
        setIsLetterbox(prev => !prev);
        playChime(490);
      }

      // M: Toggle Audio Ambience
      if (e.key === 'm' || e.key === 'M') {
        setIsAudioEnabled(prev => {
          const next = !prev;
          setAudioMute(next);
          return next;
        });
      }

      // F: Toggle Fullscreen
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      // Escape: Deselect object or exit walk
      if (e.key === 'Escape') {
        setSelectedPropId(null);
        setCameraView('overall');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, isTourPaused, setIsTourActive, setIsTourPaused, setIsLetterbox, setIsAudioEnabled, setSelectedPropId, setCameraView]);

  return (
    <>
      {/* 3D WebGL / R3F Canvas */}
      <HouseScene />

      {/* Cinematic Overlays & HUDs */}
      <CinematicLetterbox />
      <UnifiedWalkHud />
      <SnapshotFlash />
      <HotspotTooltip />
      <ItemTransformHud />
      <BlenderGrabBanner />
      <ArchicadPlanHud />

      {/* Master UI Overlay Layer */}
      <div className="ui-overlay">
        {/* Persistent Master Mode Switcher Bar */}
        <MasterModeSwitcher />

        {/* 1. Studio Editor UI */}
        <StudioUi />

        {/* 2. VIP Presentation UI */}
        <PresentationUi />

        {/* Drawers */}
        <CatalogDrawer />
        <CadDrawer />
        <BudgetDrawer />
        <InfoDrawer />
        <DrawerBackdrop />

        {/* Client Proposals & Dossier Modals */}
        <DossierModal />

        {/* AI Photo to 3D Furniture Generator Modal */}
        <ImageTo3dModal />
      </div>
    </>
  );
}
