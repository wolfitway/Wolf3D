import React, { useRef, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  housePlanAtom,
  roomDimensionsAtom,
  cameraViewAtom,
  spawnedPropsAtom
} from '../../store/atoms';
import { PLAN_SPECS } from '../../data/constants';
import { playChime } from '../../audio/audioSystem';
import { avatarManager } from '../../navigation/AvatarManager';

export default function MinimapRadar() {
  const canvasRef = useRef(null);
  const housePlan = useAtomValue(housePlanAtom);
  const roomDimensions = useAtomValue(roomDimensionsAtom);
  const cameraView = useAtomValue(cameraViewAtom);
  const setCameraView = useSetAtom(cameraViewAtom);
  const spawnedProps = useAtomValue(spawnedPropsAtom);

  const planSpec = PLAN_SPECS[housePlan] || PLAN_SPECS.villa;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;

    const renderMinimap = () => {
      animId = requestAnimationFrame(renderMinimap);
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Slate background
      ctx.fillStyle = 'rgba(10, 14, 20, 0.94)';
      ctx.fillRect(0, 0, w, h);

      const padding = 16;
      const rw = roomDimensions.width || 10;
      const rd = roomDimensions.depth || 8;
      const scaleX = (w - padding * 2) / rw;
      const scaleZ = (h - padding * 2) / rd;
      const scale = Math.min(scaleX, scaleZ);

      const cx = w / 2;
      const cy = h / 2;

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const step = scale * 2;
      for (let x = cx % step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = cy % step; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Outer Room Perimeter
      const pw = rw * scale;
      const pd = rd * scale;
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - pw / 2, cy - pd / 2, pw, pd);

      // Partitions for active plan
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      if (housePlan === 'villa') {
        // Center divider (living vs east)
        ctx.fillRect(cx - 2, cy - (3.9 * scale), 4, 2.6 * scale);
        ctx.fillRect(cx - 2, cy - (0.2 * scale), 4, 2.2 * scale);
        ctx.fillRect(cx - 2, cy + (3.1 * scale), 4, 0.8 * scale);
        // Cross divider (kitchen vs bed)
        ctx.fillRect(cx, cy - 2, 4.2 * scale, 4);
      } else if (housePlan === 'loft') {
        // Center column
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
      }

      // Props dots
      ctx.fillStyle = 'rgba(160, 200, 255, 0.65)';
      spawnedProps.forEach(p => {
        const ox = cx + p.x * scale;
        const oy = cy + p.z * scale;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Occupants / Avatars moving through rooms & doorways
      if (avatarManager && avatarManager.agents) {
        avatarManager.agents.forEach(agent => {
          if (!agent.root || !agent.root.visible) return;
          const ax = cx + agent.root.position.x * scale;
          const ay = cy + agent.root.position.z * scale;

          // Draw active path trail through doorways
          if (agent.isMoving && agent.path && agent.path.length > 0) {
            ctx.strokeStyle = 'rgba(230, 145, 56, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            for (let i = agent.pathIndex; i < agent.path.length; i++) {
              ctx.lineTo(cx + agent.path[i].x * scale, cy + agent.path[i].z * scale);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }

          const hexStr = `#${agent.colorHex.toString(16).padStart(6, '0')}`;

          // Pulsing occupant ring
          ctx.strokeStyle = hexStr;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
          ctx.stroke();

          // Occupant dot
          ctx.fillStyle = hexStr;
          ctx.beginPath();
          ctx.arc(ax, ay, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Camera pointer / cone (fixed or simulated)
      const camX = cx - 1.2 * scale;
      const camY = cy + 1.4 * scale;
      const angle = -Math.PI / 3;
      const coneLength = 26;

      const grad = ctx.createRadialGradient(camX, camY, 2, camX, camY, coneLength);
      grad.addColorStop(0, 'rgba(223, 177, 91, 0.55)');
      grad.addColorStop(1, 'rgba(223, 177, 91, 0.0)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(camX, camY);
      ctx.arc(camX, camY, coneLength, angle - 0.4, angle + 0.4);
      ctx.closePath();
      ctx.fill();

      // Camera pin dot
      ctx.fillStyle = '#dfb15b';
      ctx.beginPath();
      ctx.arc(camX, camY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    renderMinimap();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [housePlan, roomDimensions, spawnedProps]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const padding = 16;
    const rw = roomDimensions.width || 10;
    const rd = roomDimensions.depth || 8;
    const scale = Math.min((w - padding * 2) / rw, (h - padding * 2) / rd);

    const worldX = (clickX - w / 2) / scale;
    const worldZ = (clickY - h / 2) / scale;

    if (window.__wolfGlideToCoord) {
      window.__wolfGlideToCoord(worldX, worldZ);
    }
    setCameraView('walk');
    playChime(620);
  };

  return (
    <div className="pres-minimap" id="pres-minimap" title="Click anywhere on floorplan to teleport camera">
      <div className="minimap-header">
        <span className="minimap-tag">BIM RADAR</span>
        <span className="minimap-plan-name" id="minimap-plan-label">{planSpec.name.toUpperCase()}</span>
      </div>
      <canvas ref={canvasRef} id="minimap-canvas" width="180" height="130" onClick={handleCanvasClick} />
      <div className="minimap-hint">Click room to glide &bull; Gold cone shows view</div>
    </div>
  );
}
