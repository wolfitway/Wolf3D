import React from 'react';
import { useAtom } from 'jotai';
import { activeDrawerAtom } from '../../store/atoms';

export default function InfoDrawer() {
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);
  const isOpen = activeDrawer === 'info';

  if (!isOpen) return null;

  return (
    <div className="info-drawer open" id="info-drawer">
      <div className="drawer-header">
        <h3>Wolfitway Spatial Mechanics</h3>
        <button id="close-drawer-btn" onClick={() => setActiveDrawer(null)}>&times;</button>
      </div>
      <div className="drawer-content">
        <p>
          <strong>Wolfitway Project Wolf 3D</strong> combines <strong>Procedural BIM Architecture</strong>, <strong>Rapier.js WASM Physics</strong>, and <strong>VIP Presentation Cinematics</strong>:
        </p>
        <ul>
          <li>
            <strong>Studio vs. VIP Client Mode</strong>: Toggle between <em>Studio Editor</em> (change dimensions, move and rotate furniture, arrange props) and <em>Wolfitway VIP Walk-in</em> (cinematic tour, custom move creator, blueprint radar, material specs).
          </li>
          <li>
            <strong>Easy Moving Stuff</strong>: Click any furniture or prop to select it. Drag along the floor, rotate 45° with <kbd>R</kbd>, duplicate with <kbd>D</kbd>, or drop with <kbd>S</kbd>!
          </li>
          <li>
            <strong>Custom Tour Moves</strong>: In VIP mode, open <em>Tour Moves</em> to capture any custom camera perspective and direct your own VIP walkthrough!
          </li>
          <li>
            <strong>Interactive Minimap</strong>: Click anywhere on the bottom-left blueprint radar to glide directly to that room.
          </li>
        </ul>
        <div className="drawer-shortcuts">
          <small><strong>Shortcuts:</strong> [P] Toggle Studio/VIP &bull; [Space] Play/Pause Tour &bull; [C] Cinema Anamorphic &bull; [R] Rotate Item &bull; [F] Fullscreen &bull; [M] Sound &bull; WASD Walk</small>
        </div>
      </div>
    </div>
  );
}
