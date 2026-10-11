import * as THREE from 'three';

export function createSunsetCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0c1b33');
  grad.addColorStop(0.35, '#2e3a59');
  grad.addColorStop(0.58, '#d9534f');
  grad.addColorStop(0.72, '#f6aa4b');
  grad.addColorStop(0.73, '#213348');
  grad.addColorStop(1, '#0e1823');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = canvas.width * 0.52;
  const sunY = canvas.height * 0.70;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 110);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fff4cc');
  sunGrad.addColorStop(0.5, '#f59a38');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCodeScreenCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#21252b';
  ctx.fillRect(0, 0, canvas.width, 24);
  ctx.fillStyle = '#e06c75'; ctx.beginPath(); ctx.arc(14, 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e5c07b'; ctx.beginPath(); ctx.arc(26, 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#98c379'; ctx.beginPath(); ctx.arc(38, 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e2227'; ctx.fillRect(0, 24, 70, canvas.height - 24);

  const colors = ['#e5c07b', '#61afef', '#98c379', '#c678dd', '#abb2bf', '#d19a66'];
  for (let y = 38; y < canvas.height - 20; y += 14) {
    let x = 85;
    const indent = (Math.sin(y * 3) > 0.3) ? 24 : ((Math.sin(y * 2) > 0) ? 12 : 0);
    x += indent;
    const numTokens = 3 + Math.floor(Math.sin(y * 11 + 3) * 2 + 2);
    for (let t = 0; t < numTokens; t++) {
      const len = 15 + Math.abs(Math.sin(y + t * 7)) * 40;
      ctx.fillStyle = colors[(y / 14 + t) % colors.length];
      ctx.fillRect(x, y, len, 6);
      x += len + 8;
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createModernArtCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eeebe4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#b85834';
  ctx.beginPath(); ctx.arc(150, 160, 65, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2a28';
  ctx.beginPath(); ctx.arc(150, 280, 50, Math.PI, 0);
  ctx.lineWidth = 14; ctx.strokeStyle = '#2b2a28'; ctx.stroke();
  ctx.fillStyle = '#4c5948'; ctx.fillRect(140, 280, 20, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCrateWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c79c6e';
  ctx.fillRect(0, 0, 256, 256);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8c633a';
  ctx.strokeRect(4, 4, 248, 248);
  ctx.beginPath();
  ctx.moveTo(8, 8); ctx.lineTo(248, 248);
  ctx.moveTo(248, 8); ctx.lineTo(8, 248);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#a47648';
  ctx.stroke();
  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
  ctx.fillText('FRAGILE', 70, 135);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createZoneBadge(title, sub) {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 110;
  const ctx = canvas.getContext('2d');

  // Background glass card
  ctx.fillStyle = 'rgba(25, 23, 20, 0.82)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 344, 94, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pulse accent dot
  ctx.fillStyle = '#d46b38';
  ctx.beginPath();
  ctx.arc(36, 42, 7, 0, Math.PI * 2);
  ctx.fill();

  // Title text
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 55, 48);

  // Subtitle text
  ctx.font = '16px monospace';
  ctx.fillStyle = '#c5bfb6';
  ctx.fillText(sub, 55, 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDimensionLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(24, 22, 20, 0.88)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 56, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(218, 165, 32, 0.85)';
  ctx.stroke();

  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLaserMeasureBadgeTexture(distText) {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(8, 20, 28, 0.92)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 232, 52, 10);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00f5d4';
  ctx.stroke();

  // Cyan laser dot
  ctx.fillStyle = '#00f5d4';
  ctx.beginPath();
  ctx.arc(26, 30, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`↔ ${distText}`, 42, 30);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTerracottaTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base warm mortar bed
  ctx.fillStyle = '#dfd5c6';
  ctx.fillRect(0, 0, 512, 512);

  const tiles = 4;
  const tileSize = 512 / tiles;
  const mortar = 6;

  const terracottaPalette = [
    '#b85f39', '#c46942', '#a85331', '#bc653d',
    '#af5936', '#c97049', '#9e4e2d', '#b55f3a',
    '#c1663f', '#ad5633', '#bf6741', '#a5502e',
    '#b7603c', '#ca724b', '#ac5834', '#bb643e'
  ];

  for (let row = 0; row < tiles; row++) {
    for (let col = 0; col < tiles; col++) {
      const idx = (row * tiles + col) % terracottaPalette.length;
      const x = col * tileSize + mortar / 2;
      const y = row * tileSize + mortar / 2;
      const w = tileSize - mortar;
      const h = tileSize - mortar;

      // Subtle gradient on each tile
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, terracottaPalette[idx]);
      grad.addColorStop(1, terracottaPalette[(idx + 3) % terracottaPalette.length]);
      ctx.fillStyle = grad;

      // Soft rounded edge on artisan hand-fired tiles
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();

      // Subtle clay speckling / kiln patina
      ctx.fillStyle = 'rgba(60, 20, 10, 0.08)';
      for (let s = 0; s < 18; s++) {
        const sx = x + Math.random() * w;
        const sy = y + Math.random() * h;
        const sr = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle edge highlight
      ctx.strokeStyle = 'rgba(255, 230, 200, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCedarWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warm rustic cedar wood base
  ctx.fillStyle = '#aa784f';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const planks = 6;
  const plankH = 512 / planks;

  for (let p = 0; p < planks; p++) {
    const y = p * plankH;
    const grad = ctx.createLinearGradient(0, y, 512, y + plankH);
    grad.addColorStop(0, '#9f6f46');
    grad.addColorStop(0.5, '#b48259');
    grad.addColorStop(1, '#97663e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, plankH - 2);

    // Fine wood grain streaks
    ctx.strokeStyle = 'rgba(70, 40, 20, 0.14)';
    for (let g = 0; g < 14; g++) {
      const gy = y + Math.random() * plankH;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(
        150, gy + (Math.random() - 0.5) * 8,
        350, gy + (Math.random() - 0.5) * 8,
        512, gy + (Math.random() - 0.5) * 4
      );
      ctx.stroke();
    }

    // Plank gap shadow
    ctx.fillStyle = 'rgba(40, 20, 10, 0.35)';
    ctx.fillRect(0, y + plankH - 2, 512, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTravertineTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Roman travertine warm limestone base
  ctx.fillStyle = '#e8decb';
  ctx.fillRect(0, 0, 512, 512);

  // Horizontal stone veining & sediment bands
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 512;
    const h = 4 + Math.random() * 20;
    const alpha = 0.04 + Math.random() * 0.08;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(180, 155, 125, ${alpha})` : `rgba(255, 250, 240, ${alpha * 1.5})`;
    ctx.fillRect(0, y, 512, h);
  }

  // Travertine micro pores
  ctx.fillStyle = 'rgba(120, 95, 75, 0.12)';
  for (let p = 0; p < 80; p++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pw = 2 + Math.random() * 6;
    const ph = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.ellipse(px, py, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLinenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Warm natural oatmeal linen base
  ctx.fillStyle = '#ebe3d5';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle woven fiber pattern
  ctx.strokeStyle = 'rgba(120, 105, 85, 0.09)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 256; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLimewashPlasterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warm Mediterranean mineral lime base
  ctx.fillStyle = '#f3ece2';
  ctx.fillRect(0, 0, 512, 512);

  // Broad artisan trowel sweeps & multi-tonal calcified nuances
  const sweeps = [
    { color: 'rgba(235, 224, 210, 0.45)', cx: 180, cy: 160, r: 240 },
    { color: 'rgba(255, 252, 246, 0.50)', cx: 340, cy: 320, r: 260 },
    { color: 'rgba(224, 212, 196, 0.35)', cx: 120, cy: 380, r: 220 },
    { color: 'rgba(248, 241, 230, 0.40)', cx: 400, cy: 140, r: 230 }
  ];

  sweeps.forEach(s => {
    const grad = ctx.createRadialGradient(s.cx, s.cy, 20, s.cx, s.cy, s.r);
    grad.addColorStop(0, s.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Curved Venetian plaster trowel arcs
  ctx.lineWidth = 18;
  for (let i = 0; i < 28; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const alpha = 0.05 + Math.random() * 0.08;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(215, 202, 185, ${alpha})` : `rgba(255, 255, 250, ${alpha * 1.4})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + (Math.random() - 0.5) * 160,
      sy + (Math.random() - 0.5) * 120,
      sx + (Math.random() - 0.5) * 220,
      sy + (Math.random() - 0.5) * 180
    );
    ctx.stroke();
  }

  // Fine sand micro-stippling & natural chalk aggregate
  ctx.fillStyle = 'rgba(160, 140, 120, 0.06)';
  for (let d = 0; d < 350; d++) {
    const dx = Math.random() * 512;
    const dy = Math.random() * 512;
    const dr = 0.8 + Math.random() * 1.8;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPlasterBumpMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Mid-gray baseline
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // Soft trowel height shifts
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const isRaised = Math.random() > 0.5;
    ctx.strokeStyle = isRaised ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';
    ctx.lineWidth = 14 + Math.random() * 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 80, y + 50, x + 160, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }

  // Micro stipple bump
  for (let n = 0; n < 600; n++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    const val = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.08)`;
    ctx.fillRect(nx, ny, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

export function createFlutedWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark acoustic shadow reveal backing
  ctx.fillStyle = '#1c1713';
  ctx.fillRect(0, 0, 512, 512);

  const slatCount = 24;
  const slatW = 512 / slatCount;
  const gap = 3.5;

  for (let s = 0; s < slatCount; s++) {
    const x = s * slatW + gap / 2;
    const w = slatW - gap;

    // Curved cylindrical slat gradient
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#785334');
    grad.addColorStop(0.25, '#ab7c52');
    grad.addColorStop(0.5, '#c49567');
    grad.addColorStop(0.75, '#ab7c52');
    grad.addColorStop(1, '#664326');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, 512);

    // Fine vertical grain lines
    ctx.strokeStyle = 'rgba(50, 30, 15, 0.18)';
    for (let g = 0; g < 4; g++) {
      const gx = x + 2 + Math.random() * (w - 4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, 512);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWovenLinenCurtainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base sheer gauze fabric
  ctx.fillStyle = '#faf6f0';
  ctx.fillRect(0, 0, 512, 512);

  // Micro vertical thread drapery weave
  ctx.strokeStyle = 'rgba(150, 135, 115, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(512, x);
    ctx.stroke();
  }

  // Cross weft
  ctx.strokeStyle = 'rgba(150, 135, 115, 0.05)';
  for (let y = 0; y < 512; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Vertical drapery fold shading waves
  for (let w = 0; w < 512; w += 64) {
    const foldGrad = ctx.createLinearGradient(w, 0, w + 64, 0);
    foldGrad.addColorStop(0, 'rgba(0, 0, 0, 0.06)');
    foldGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    foldGrad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(w, 0, 64, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
