import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import RAPIER from '@dimforge/rapier3d-compat';

// ============================================================================
// ADAPTIVE SPATIAL ENGINE & ARCHITECTURAL CONFIGURATOR
// ============================================================================

// --- Setup Scene, Camera, Renderer ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7cfc4);
scene.fog = new THREE.FogExp2(0xd7cfc4, 0.018);

let roomWidth = 11.0;
let roomDepth = 7.8;
let wallHeight = 3.4;
let currentPlanId = 'villa';

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);

const CAMERA_PRESETS = {
  overall: {
    pos: new THREE.Vector3(16.5, 14.0, 15.2),
    target: new THREE.Vector3(0.5, 1.2, 0),
  },
  joinery: {
    pos: new THREE.Vector3(4.8, 4.8, -1.8),
    target: new THREE.Vector3(2.6, 1.3, -1.8),
  },
  plan: {
    pos: new THREE.Vector3(0.01, 23.0, 0.01),
    target: new THREE.Vector3(0, 0, 0),
  },
  walk: {
    pos: new THREE.Vector3(-2.8, 1.65, 1.2),
    target: new THREE.Vector3(0, 1.65, 0),
  }
};

camera.position.copy(CAMERA_PRESETS.overall.pos);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(CAMERA_PRESETS.overall.target);
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2;
controls.maxDistance = 45;

// ============================================================================
// RAPIER.JS WASM PHYSICS SYSTEM INITIALIZATION
// ============================================================================

let physicsWorld = null;
const physicsObjects = []; // Array of { mesh, body, collider }
let floorCollider = null;
let wallColliders = [];
let activePartitionColliders = []; // Array of { x, y, z, hx, hy, hz }

async function initPhysics() {
  await RAPIER.init();
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  physicsWorld = new RAPIER.World(gravity);

  updatePhysicsBoundaries();
  console.log('Rapier3D WASM Physics engine active.');
}

function updatePhysicsBoundaries() {
  if (!physicsWorld) return;

  // Clear existing boundary colliders
  if (floorCollider) {
    physicsWorld.removeCollider(floorCollider, true);
    floorCollider = null;
  }
  wallColliders.forEach(c => physicsWorld.removeCollider(c, true));
  wallColliders = [];

  // Ground plane collider
  const floorDesc = RAPIER.ColliderDesc.cuboid(roomWidth / 2 + 1, 0.1, roomDepth / 2 + 1)
    .setTranslation(0, -0.1, 0)
    .setFriction(0.7)
    .setRestitution(0.2);
  floorCollider = physicsWorld.createCollider(floorDesc);

  // Outer boundary walls
  const backWallDesc = RAPIER.ColliderDesc.cuboid(roomWidth / 2, wallHeight / 2, 0.1)
    .setTranslation(0, wallHeight / 2, -roomDepth / 2 - 0.1);
  wallColliders.push(physicsWorld.createCollider(backWallDesc));

  const leftWallDesc = RAPIER.ColliderDesc.cuboid(0.1, wallHeight / 2, roomDepth / 2)
    .setTranslation(-roomWidth / 2 - 0.1, wallHeight / 2, 0);
  wallColliders.push(physicsWorld.createCollider(leftWallDesc));

  const rightWallDesc = RAPIER.ColliderDesc.cuboid(0.1, wallHeight / 2, roomDepth / 2)
    .setTranslation(roomWidth / 2 + 0.1, wallHeight / 2, 0);
  wallColliders.push(physicsWorld.createCollider(rightWallDesc));

  // Add interior partition wall colliders from active plan!
  for (const p of activePartitionColliders) {
    const desc = RAPIER.ColliderDesc.cuboid(p.hx, p.hy, p.hz)
      .setTranslation(p.x, p.y, p.z)
      .setFriction(0.5);
    wallColliders.push(physicsWorld.createCollider(desc));
  }
}

// ============================================================================
// DYNAMIC PROCEDURAL TEXTURE GENERATORS
// ============================================================================

function createSunsetCanvas() {
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

function createCodeScreenCanvas() {
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

function createModernArtCanvas() {
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

function createCrateWoodTexture() {
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

function createZoneBadge(title, sub) {
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

const sunsetTex = createSunsetCanvas();
const codeTex = createCodeScreenCanvas();
const modernArtTex = createModernArtCanvas();
const crateWoodTex = createCrateWoodTexture();

// ============================================================================
// MATERIALS PALETTE & ARCHITECTURAL STYLES
// ============================================================================

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.55 }),
  floorPlinth: new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.8 }),
  track: new THREE.MeshStandardMaterial({ color: 0x938d84, roughness: 0.4, metalness: 0.6 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.85 }),
  wallEdge: new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.8 }),
  partitionWall: new THREE.MeshStandardMaterial({ color: 0xe5dfd5, roughness: 0.82 }),
  oakLight: new THREE.MeshStandardMaterial({ color: 0xd6bda0, roughness: 0.6 }),
  oakDark: new THREE.MeshStandardMaterial({ color: 0x9e7b56, roughness: 0.7 }),
  cushionCream: new THREE.MeshStandardMaterial({ color: 0xede6db, roughness: 0.9 }),
  cushionTerracotta: new THREE.MeshStandardMaterial({ color: 0xb55a36, roughness: 0.85 }),
  cushionOlive: new THREE.MeshStandardMaterial({ color: 0x485842, roughness: 0.85 }),
  charcoalMetal: new THREE.MeshStandardMaterial({ color: 0x282624, roughness: 0.35, metalness: 0.7 }),
  warmLed: new THREE.MeshStandardMaterial({ color: 0xffa044, emissive: 0xffa044, emissiveIntensity: 2.2 }),
  projectorScreen: new THREE.MeshStandardMaterial({ map: sunsetTex, emissive: 0xffa055, emissiveMap: sunsetTex, emissiveIntensity: 0.75 }),
  computerScreen: new THREE.MeshStandardMaterial({ map: codeTex, emissive: 0x61afef, emissiveMap: codeTex, emissiveIntensity: 0.8 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xf5f1eb, roughness: 0.95, transparent: true, opacity: 0.9 }),
  kitchenStone: new THREE.MeshStandardMaterial({ color: 0x262524, roughness: 0.35 }),
  kitchenWhiteMarble: new THREE.MeshStandardMaterial({ color: 0xeeeae4, roughness: 0.3 }),
  bedLinen: new THREE.MeshStandardMaterial({ color: 0xf1ece4, roughness: 0.9 }),
  bedDuvet: new THREE.MeshStandardMaterial({ color: 0x3d3936, roughness: 0.85 }),
  plantLeaf: new THREE.MeshStandardMaterial({ color: 0x384a32, roughness: 0.6 }),
  potCeramic: new THREE.MeshStandardMaterial({ color: 0xcbc4b8, roughness: 0.6 }),
  crateWood: new THREE.MeshStandardMaterial({ map: crateWoodTex, roughness: 0.7 }),
  steelBox: new THREE.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.3, metalness: 0.85 }),
  carpetGrey: new THREE.MeshStandardMaterial({ color: 0xbfb8ae, roughness: 0.95 }),
  glassPartition: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1, transmission: 0.9 }),
};

// Architectural Styles Palette Matrix
const STYLES = {
  scandi: {
    name: 'Scandinavian Modern',
    floorColor: 0xded8ce,
    wallColor: 0xe8e2d8,
    woodColor: 0xd6bda0,
    cushionColor: 0xede6db,
    curtainColor: 0xf5f1eb,
    curtainOpacity: 0.9,
    sunColor: 0xfff1dd,
    sunIntensity: 2.2,
    bg: 0xd7cfc4,
  },
  mediterranean: {
    name: 'Mediterranean Coastal',
    floorColor: 0xb86c47, // Terracotta tile tone
    wallColor: 0xf2ece1, // Limewash sand
    woodColor: 0xaa7c52, // Rustic aged cedar
    cushionColor: 0xdfcbb5, // Sun-bleached linen
    curtainColor: 0xfff8ee, // Breezy gauze
    curtainOpacity: 0.75,
    sunColor: 0xffe6b8, // Warm Aegean sun
    sunIntensity: 2.6,
    bg: 0xd9cbbe,
  },
  european: {
    name: 'European Classical',
    floorColor: 0x6a4b35, // Rich dark herringbone oak
    wallColor: 0xe5dfd4, // Haussmannian plaster
    woodColor: 0x7a583d, // Walnut joinery
    cushionColor: 0x2d3648, // Deep Parisian sapphire velvet
    curtainColor: 0x3b4453, // Heavy velvet drapery
    curtainOpacity: 0.96,
    sunColor: 0xffecc6,
    sunIntensity: 1.9,
    bg: 0xccc5b8,
  },
  japandi: {
    name: 'Asian Japandi',
    floorColor: 0x45423e, // Deep basalt charcoal timber
    wallColor: 0xdad3c5, // Rice paper plaster
    woodColor: 0x5c4a3b, // Dark Japanese walnut
    cushionColor: 0x626c59, // Matcha green upholstery
    curtainColor: 0xf8f3e8, // Shoji paper translucent screen
    curtainOpacity: 0.85,
    sunColor: 0xfff2e0,
    sunIntensity: 2.0,
    bg: 0xc8c3b9,
  }
};

let currentStyleKey = 'scandi';

function applyStyle(styleKey) {
  currentStyleKey = styleKey;
  const s = STYLES[styleKey];
  if (!s) return;

  gsap.to(materials.floor.color, { ...new THREE.Color(s.floorColor), duration: 0.8 });
  gsap.to(materials.wall.color, { ...new THREE.Color(s.wallColor), duration: 0.8 });
  gsap.to(materials.partitionWall.color, { ...new THREE.Color(s.wallColor), duration: 0.8 });
  gsap.to(materials.oakLight.color, { ...new THREE.Color(s.woodColor), duration: 0.8 });
  gsap.to(materials.cushionCream.color, { ...new THREE.Color(s.cushionColor), duration: 0.8 });
  gsap.to(materials.curtain.color, { ...new THREE.Color(s.curtainColor), duration: 0.8 });
  materials.curtain.opacity = s.curtainOpacity;

  gsap.to(sunLight.color, { ...new THREE.Color(s.sunColor), duration: 0.8 });
  gsap.to(sunLight, { intensity: s.sunIntensity, duration: 0.8 });
  scene.background.set(s.bg);
  scene.fog.color.set(s.bg);

  document.querySelectorAll('.style-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === styleKey);
  });
}

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.15);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff1dd, 2.2);
sunLight.position.set(-10, 12, -4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0003;
scene.add(sunLight);

// ============================================================================
// ARCHITECTURAL HOUSE PLAN GENERATOR (VILLA, STUDIO, LOFT)
// ============================================================================

const houseGroup = new THREE.Group();
scene.add(houseGroup);

// Transformable joinery variables for studio mode
let murphyPivotGroup = null;
let deskFoldGroup = null;
let chairGroup = null;
let slidingPocketDoor = null;
let diningLeaf = null;
let projScreenMesh = null;
let projectorGlow = null;
let bedReadingLight = null;

function clearHousePlan() {
  while (houseGroup.children.length > 0) {
    const child = houseGroup.children[0];
    houseGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
  }
  activePartitionColliders = [];
}

function loadHousePlan(planId) {
  currentPlanId = planId;
  clearHousePlan();

  if (planId === 'villa') {
    roomWidth = 11.0;
    roomDepth = 7.8;
    wallHeight = 3.4;

    // Update Presets for Villa
    CAMERA_PRESETS.overall.pos.set(16.5, 14.0, 15.2);
    CAMERA_PRESETS.overall.target.set(0.5, 1.2, 0);

    CAMERA_PRESETS.joinery.pos.set(4.8, 4.8, -1.8);
    CAMERA_PRESETS.joinery.target.set(2.6, 1.3, -1.8); // Focus on Gourmet Kitchen

    CAMERA_PRESETS.plan.pos.set(0.01, 23.0, 0.01);
    CAMERA_PRESETS.plan.target.set(0, 0, 0);

    CAMERA_PRESETS.walk.pos.set(-2.8, 1.65, 1.2); // Start inside Living Salon
    CAMERA_PRESETS.walk.target.set(0, 1.65, 0);

    buildVillaPlan();
  } else if (planId === 'studio') {
    roomWidth = 6.8;
    roomDepth = 5.2;
    wallHeight = 3.4;

    CAMERA_PRESETS.overall.pos.set(12.5, 9.8, 11.2);
    CAMERA_PRESETS.overall.target.set(0.2, 1.4, -0.2);

    CAMERA_PRESETS.joinery.pos.set(5.2, 4.4, 4.2);
    CAMERA_PRESETS.joinery.target.set(1.8, 2.0, -0.6);

    CAMERA_PRESETS.plan.pos.set(0.01, 16.5, 0.01);
    CAMERA_PRESETS.plan.target.set(0, 0, 0);

    CAMERA_PRESETS.walk.pos.set(0, 1.65, 1.8);
    CAMERA_PRESETS.walk.target.set(0, 1.65, -0.5);

    buildStudioPlan();
  } else if (planId === 'loft') {
    roomWidth = 9.0;
    roomDepth = 7.0;
    wallHeight = 3.8;

    CAMERA_PRESETS.overall.pos.set(14.5, 12.0, 13.5);
    CAMERA_PRESETS.overall.target.set(0, 1.5, 0);

    CAMERA_PRESETS.joinery.pos.set(3.5, 4.2, 2.8);
    CAMERA_PRESETS.joinery.target.set(1.5, 1.2, 1.0);

    CAMERA_PRESETS.plan.pos.set(0.01, 20.0, 0.01);
    CAMERA_PRESETS.plan.target.set(0, 0, 0);

    CAMERA_PRESETS.walk.pos.set(-2.0, 1.65, 1.5);
    CAMERA_PRESETS.walk.target.set(0, 1.65, 0);

    buildLoftPlan();
  }

  // Update CAD UI Controls
  const widthSlider = document.getElementById('room-width-slider');
  const depthSlider = document.getElementById('room-depth-slider');
  const heightSlider = document.getElementById('room-height-slider');
  if (widthSlider) widthSlider.value = roomWidth;
  if (depthSlider) depthSlider.value = roomDepth;
  if (heightSlider) heightSlider.value = wallHeight;

  document.getElementById('val-width').textContent = `${roomWidth.toFixed(1)} m`;
  document.getElementById('val-depth').textContent = `${roomDepth.toFixed(1)} m`;
  document.getElementById('val-height').textContent = `${wallHeight.toFixed(1)} m`;

  const area = (roomWidth * roomDepth).toFixed(1);
  const volume = (roomWidth * roomDepth * wallHeight).toFixed(1);
  document.getElementById('readout-area').innerHTML = `${area} M&sup2;`;
  document.getElementById('readout-volume').innerHTML = `${volume} M&sup3;`;

  // Update Studio Meta Specs
  if (planId === 'villa') {
    document.getElementById('room-meta-specs').innerHTML = `VILLA SUITE &bull; ${roomWidth.toFixed(1)} &times; ${roomDepth.toFixed(1)} &bull; ${area} M&sup2;`;
    document.getElementById('callout-text').innerHTML = `Villa Architecture &bull; Living Salon, Kitchen & Master Suite with Walkable Portals`;
    document.getElementById('readout-doors').innerHTML = `2 Walkable Portals`;
  } else if (planId === 'studio') {
    document.getElementById('room-meta-specs').innerHTML = `MICRO STUDIO &bull; ${roomWidth.toFixed(1)} &times; ${roomDepth.toFixed(1)} &bull; ${area} M&sup2;`;
    document.getElementById('callout-text').innerHTML = `Adaptive Micro Studio &bull; Kinematic Transforming Joinery`;
    document.getElementById('readout-doors').innerHTML = `1 Entrance Door`;
  } else {
    document.getElementById('room-meta-specs').innerHTML = `OPEN LOFT &bull; ${roomWidth.toFixed(1)} &times; ${roomDepth.toFixed(1)} &bull; ${area} M&sup2;`;
    document.getElementById('callout-text').innerHTML = `Open Industrial Loft &bull; Exposed Column & Split Creative Studio`;
    document.getElementById('readout-doors').innerHTML = `Open Plan Archway`;
  }

  // Update Presentation HUD Title & Stats
  const presTitle = document.getElementById('pres-title');
  const statArea = document.getElementById('pres-stat-area');
  const statHeight = document.getElementById('pres-stat-height');
  const statDaylight = document.getElementById('pres-stat-daylight');
  if (statArea) statArea.innerHTML = `${area} M&sup2;`;
  if (statHeight) statHeight.innerHTML = `${wallHeight.toFixed(1)} M`;

  if (planId === 'villa') {
    if (presTitle) presTitle.innerHTML = `Project Villa Lumina <span class="pres-subtitle" id="pres-subtitle">&bull; Executive Residence</span>`;
    if (statDaylight) statDaylight.innerHTML = `94%`;
  } else if (planId === 'studio') {
    if (presTitle) presTitle.innerHTML = `Project Atelier Micro <span class="pres-subtitle" id="pres-subtitle">&bull; Adaptive Studio</span>`;
    if (statDaylight) statDaylight.innerHTML = `89%`;
  } else {
    if (presTitle) presTitle.innerHTML = `Project Tribeca Loft <span class="pres-subtitle" id="pres-subtitle">&bull; Creative Penthouse</span>`;
    if (statDaylight) statDaylight.innerHTML = `98%`;
  }

  // Update Top Bar & CAD drawer active buttons
  document.querySelectorAll('.plan-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.plan === planId);
  });
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.toggle('active', card.dataset.plan === planId);
  });

  // Re-synchronize physics colliders
  updatePhysicsBoundaries();

  // Apply current visual style colors
  applyStyle(currentStyleKey);

  // Update Blueprint Minimap Plan Label
  const minimapPlanLabel = document.getElementById('minimap-plan-label');
  if (minimapPlanLabel) {
    minimapPlanLabel.textContent = planId === 'villa' ? 'VILLA SUITE' : (planId === 'studio' ? 'URBAN STUDIO' : 'ATELIER LOFT');
  }

  // Initialize Custom Tour Moves for this plan
  if (typeof initTourMoves === 'function') {
    initTourMoves();
  }

  // Rebuild Hotspots & Dimension lines
  if (typeof buildHotspots === 'function') buildHotspots();
  if (typeof buildDimensionRulers === 'function') buildDimensionRulers();

  // Smooth camera reposition if not currently in walk mode and in studio
  if (currentCameraMode !== 'walk') {
    if (currentAppMode === 'presentation') {
      goToBookmark('entrance');
    } else {
      const preset = CAMERA_PRESETS[currentCameraMode] || CAMERA_PRESETS.overall;
      gsap.to(camera.position, { ...preset.pos, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(controls.target, { ...preset.target, duration: 1.2, ease: 'power2.inOut' });
    }
  }
}

// ----------------------------------------------------------------------------
// PLAN BUILDER 1: VILLA SUITE (3 ROOMS + DOORWAY PORTALS)
// ----------------------------------------------------------------------------

function buildVillaPlan() {
  const w = roomWidth;
  const d = roomDepth;
  const h = wallHeight;

  // 1. Foundation & Floor
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
  floorMesh.position.set(0, -0.1, 0);
  floorMesh.receiveShadow = true;
  houseGroup.add(floorMesh);

  const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.4, d + 0.2), materials.floorPlinth);
  plinthMesh.position.set(0, -0.38, 0);
  houseGroup.add(plinthMesh);

  // 2. Exterior Perimeter Walls (Diorama cutaway: solid Back & Left walls, open Front & Right)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
  backWall.position.set(0, h / 2, -d / 2 - 0.1);
  backWall.receiveShadow = true;
  houseGroup.add(backWall);

  const backWallCap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.24), materials.wallEdge);
  backWallCap.position.set(0, h + 0.04, -d / 2 - 0.1);
  houseGroup.add(backWallCap);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
  leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
  leftWall.receiveShadow = true;
  houseGroup.add(leftWall);

  const leftWallCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, d), materials.wallEdge);
  leftWallCap.position.set(-w / 2 - 0.1, h + 0.04, 0);
  houseGroup.add(leftWallCap);

  // Big panoramic picture window on left wall
  const leftWindowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 3.6), materials.charcoalMetal);
  leftWindowFrame.position.set(-w / 2 + 0.02, 1.8, -1.0);
  houseGroup.add(leftWindowFrame);

  const leftCurtain = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.9, 3.8), materials.curtain);
  leftCurtain.position.set(-w / 2 + 0.08, 1.7, -1.0);
  houseGroup.add(leftCurtain);

  // 3. INTERIOR PARTITION WALLS WITH WALKABLE DOORWAY PORTALS
  // Wall 1: Center Longitudinal Divider at X = 0.0 separating Living Salon from East Wing
  // Segment A: z from -3.9 to -1.3 (length 2.6m)
  const partA_len = 2.6;
  const partA_z = -3.9 + partA_len / 2;
  const partA = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partA_len), materials.partitionWall);
  partA.position.set(0, h / 2, partA_z);
  partA.castShadow = true;
  partA.receiveShadow = true;
  houseGroup.add(partA);
  activePartitionColliders.push({ x: 0, y: h / 2, z: partA_z, hx: 0.1, hy: h / 2, hz: partA_len / 2 });

  // Doorway 1 Portal Header (Lintel beam above walk-through door at z = -0.75, width 1.1m)
  const lintel1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h - 2.2, 1.1), materials.partitionWall);
  lintel1.position.set(0, 2.2 + (h - 2.2) / 2, -0.75);
  houseGroup.add(lintel1);
  const doorFrame1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.25, 1.15), materials.charcoalMetal);
  doorFrame1.position.set(0, 1.125, -0.75);
  doorFrame1.material = materials.oakDark;
  doorFrame1.scale.set(1.02, 1, 1.02);

  // Segment B: z from -0.2 to 2.0 (length 2.2m)
  const partB_len = 2.2;
  const partB_z = -0.2 + partB_len / 2;
  const partB = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partB_len), materials.partitionWall);
  partB.position.set(0, h / 2, partB_z);
  partB.castShadow = true;
  partB.receiveShadow = true;
  houseGroup.add(partB);
  activePartitionColliders.push({ x: 0, y: h / 2, z: partB_z, hx: 0.1, hy: h / 2, hz: partB_len / 2 });

  // Doorway 2 Portal Header into Master Bedroom (at z = 2.55, width 1.1m)
  const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h - 2.2, 1.1), materials.partitionWall);
  lintel2.position.set(0, 2.2 + (h - 2.2) / 2, 2.55);
  houseGroup.add(lintel2);

  // Segment C: z from 3.1 to 3.9 (length 0.8m)
  const partC_len = 0.8;
  const partC_z = 3.1 + partC_len / 2;
  const partC = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partC_len), materials.partitionWall);
  partC.position.set(0, h / 2, partC_z);
  partC.castShadow = true;
  partC.receiveShadow = true;
  houseGroup.add(partC);
  activePartitionColliders.push({ x: 0, y: h / 2, z: partC_z, hx: 0.1, hy: h / 2, hz: partC_len / 2 });

  // Wall 2: Cross Divider at Z = 0 separating Kitchen/Dining from Master Bedroom
  // Segment: x from 0.0 to 4.2 (length 4.2m)
  const partCross_len = 4.2;
  const partCross_x = partCross_len / 2;
  const partCross = new THREE.Mesh(new THREE.BoxGeometry(partCross_len, h, 0.2), materials.partitionWall);
  partCross.position.set(partCross_x, h / 2, 0);
  partCross.castShadow = true;
  partCross.receiveShadow = true;
  houseGroup.add(partCross);
  activePartitionColliders.push({ x: partCross_x, y: h / 2, z: 0, hx: partCross_len / 2, hy: h / 2, hz: 0.1 });

  // 4. FURNITURE: ZONE 1 - GRAND LIVING SALON (Left Wing)
  const living = new THREE.Group();
  houseGroup.add(living);

  // Large geometric area rug
  const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.015, 3.4), materials.carpetGrey);
  rug.position.set(-2.8, 0.008, 0.2);
  rug.receiveShadow = true;
  living.add(rug);

  // L-Sectional Plush Sofa
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.38, 1.05), materials.oakLight);
  sofaBase.position.set(-2.8, 0.19, 1.2);
  sofaBase.castShadow = true;
  living.add(sofaBase);

  const sofaReturn = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 1.6), materials.oakLight);
  sofaReturn.position.set(-4.0, 0.19, 0.4);
  sofaReturn.castShadow = true;
  living.add(sofaReturn);

  // Sofa Cushions
  const cushionMain = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 0.95), materials.cushionCream);
  cushionMain.position.set(-2.8, 0.47, 1.2);
  cushionMain.castShadow = true;
  living.add(cushionMain);

  const cushionReturn = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 1.5), materials.cushionCream);
  cushionReturn.position.set(-4.0, 0.47, 0.4);
  cushionReturn.castShadow = true;
  living.add(cushionReturn);

  // Sofa Backrest
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.42, 0.22), materials.cushionCream);
  sofaBack.position.set(-2.8, 0.68, 1.7);
  living.add(sofaBack);

  const sofaBackSide = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 2.4), materials.cushionCream);
  sofaBackSide.position.set(-4.6, 0.68, 0.8);
  living.add(sofaBackSide);

  // Throw Pillows
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.14), materials.cushionTerracotta);
  p1.position.set(-2.0, 0.65, 1.55);
  p1.rotation.y = 0.2;
  living.add(p1);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.14), materials.cushionOlive);
  p2.position.set(-3.5, 0.65, 1.55);
  p2.rotation.y = -0.15;
  living.add(p2);

  // Coffee Table
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.75), materials.oakLight);
  coffeeTable.position.set(-2.6, 0.35, 0.0);
  coffeeTable.castShadow = true;
  living.add(coffeeTable);
  for (let cx of [-0.6, 0.6]) {
    for (let cz of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35), materials.charcoalMetal);
      leg.position.set(-2.6 + cx, 0.175, cz);
      living.add(leg);
    }
  }

  // Media Feature Wall on back wall
  const mediaSlats = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 0.06), materials.oakLight);
  mediaSlats.position.set(-2.8, 1.7, -d / 2 + 0.05);
  living.add(mediaSlats);

  const oledTv = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.04), materials.charcoalMetal);
  oledTv.position.set(-2.8, 1.85, -d / 2 + 0.1);
  living.add(oledTv);

  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.98), new THREE.MeshBasicMaterial({ map: sunsetTex }));
  tvScreen.position.set(-2.8, 1.85, -d / 2 + 0.125);
  living.add(tvScreen);

  const floatingConsole = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.35), materials.charcoalMetal);
  floatingConsole.position.set(-2.8, 0.65, -d / 2 + 0.2);
  living.add(floatingConsole);

  // Modern Floor Arc Lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04), materials.charcoalMetal);
  lampBase.position.set(-4.5, 0.02, 2.5);
  living.add(lampBase);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.1), materials.charcoalMetal);
  lampPole.position.set(-4.5, 1.05, 2.5);
  living.add(lampPole);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 16), materials.oakLight);
  lampShade.position.set(-4.2, 2.1, 2.3);
  lampShade.rotation.x = 0.3;
  living.add(lampShade);

  // 5. FURNITURE: ZONE 2 - GOURMET KITCHEN & DINING (Top Right)
  const kitchen = new THREE.Group();
  houseGroup.add(kitchen);

  // Chef's Waterfall Stone Island
  const islandTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.05), materials.kitchenWhiteMarble);
  islandTop.position.set(2.8, 0.45, -2.4);
  islandTop.castShadow = true;
  kitchen.add(islandTop);

  const cooktop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), materials.charcoalMetal);
  cooktop.position.set(2.3, 0.91, -2.4);
  kitchen.add(cooktop);

  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32), materials.charcoalMetal);
  faucet.position.set(3.4, 1.05, -2.4);
  kitchen.add(faucet);

  // 3 Bar Stools along Island
  for (let i = 0; i < 3; i++) {
    const sx = 2.0 + i * 0.8;
    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), materials.oakLight);
    stoolSeat.position.set(sx, 0.65, -1.65);
    kitchen.add(stoolSeat);
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), materials.charcoalMetal);
    stoolLeg.position.set(sx, 0.325, -1.65);
    kitchen.add(stoolLeg);
  }

  // Dining Table with 4 Chairs
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.9), materials.oakLight);
  diningTable.position.set(2.8, 0.74, -0.6);
  diningTable.castShadow = true;
  kitchen.add(diningTable);

  for (let dx of [-0.8, 0.8]) {
    for (let dz of [-0.35, 0.35]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74), materials.charcoalMetal);
      leg.position.set(2.8 + dx, 0.37, -0.6 + dz);
      kitchen.add(leg);
    }
  }

  // 4 Dining Chairs
  for (let i = 0; i < 2; i++) {
    const cx = 2.3 + i * 1.0;
    // North side
    const chairNorth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), materials.cushionCream);
    chairNorth.position.set(cx, 0.44, -1.15);
    kitchen.add(chairNorth);
    // South side
    const chairSouth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), materials.cushionCream);
    chairSouth.position.set(cx, 0.44, -0.05);
    kitchen.add(chairSouth);
  }

  // Suspended Linear Pendant Chandelier over Island
  const linearPendant = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.06), materials.charcoalMetal);
  linearPendant.position.set(2.8, 2.5, -2.4);
  kitchen.add(linearPendant);
  const pendantLed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.015, 0.04), materials.warmLed);
  pendantLed.position.set(2.8, 2.47, -2.4);
  kitchen.add(pendantLed);

  // 6. FURNITURE: ZONE 3 - MASTER BEDROOM SUITE (Bottom Right)
  const bedroom = new THREE.Group();
  houseGroup.add(bedroom);

  // Bedside Runner Rug
  const bedRug = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.015, 2.6), materials.carpetGrey);
  bedRug.position.set(2.6, 0.008, 2.2);
  bedroom.add(bedRug);

  // King Platform Bed
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 2.2), materials.oakLight);
  bedFrame.position.set(2.6, 0.14, 2.2);
  bedFrame.castShadow = true;
  bedroom.add(bedFrame);

  // Upholstered Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.25, 2.3), materials.cushionCream);
  headboard.position.set(1.5, 0.68, 2.2);
  bedroom.add(headboard);

  // Deep Comfy Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 2.0), materials.bedLinen);
  mattress.position.set(2.6, 0.38, 2.2);
  bedroom.add(mattress);

  // Crisp Layered Duvet
  const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.26, 1.4), materials.bedDuvet);
  duvet.position.set(2.8, 0.40, 2.5);
  bedroom.add(duvet);

  // Pillows
  for (let pz of [1.6, 2.2, 2.8]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.55), materials.bedLinen);
    pillow.position.set(1.8, 0.56, pz);
    bedroom.add(pillow);
  }

  // Floating Nightstand
  const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.45), materials.oakLight);
  nightstand.position.set(1.5, 0.4, 0.8);
  bedroom.add(nightstand);

  const nightLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.28, 16), materials.potCeramic);
  nightLamp.position.set(1.5, 0.66, 0.8);
  bedroom.add(nightLamp);

  // Wardrobe Closet Partition on the right side
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.7, 1.8), materials.oakLight);
  wardrobe.position.set(4.8, 1.35, 2.0);
  bedroom.add(wardrobe);

  // 7. FLOATING 3D ARCHITECTURAL ZONE BADGES
  const badgeLiving = createZoneBadge('Living Salon', '42.9 M² • Lounge Suite');
  const spriteLiving = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeLiving, transparent: true, opacity: 0.95 }));
  spriteLiving.scale.set(3.2, 0.98, 1);
  spriteLiving.position.set(-2.8, 2.9, 0.2);
  houseGroup.add(spriteLiving);

  const badgeKitchen = createZoneBadge('Kitchen & Dining', '21.5 M² • Gourmet Island');
  const spriteKitchen = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeKitchen, transparent: true, opacity: 0.95 }));
  spriteKitchen.scale.set(3.2, 0.98, 1);
  spriteKitchen.position.set(2.8, 2.9, -1.8);
  houseGroup.add(spriteKitchen);

  const badgeBed = createZoneBadge('Master Bedroom', '21.4 M² • King Suite');
  const spriteBed = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeBed, transparent: true, opacity: 0.95 }));
  spriteBed.scale.set(3.2, 0.98, 1);
  spriteBed.position.set(2.8, 2.9, 2.2);
  houseGroup.add(spriteBed);
}

// ----------------------------------------------------------------------------
// PLAN BUILDER 2: MICRO STUDIO (ADAPTIVE JOINERY + TRANSFORMATIONS)
// ----------------------------------------------------------------------------

function buildStudioPlan() {
  const w = roomWidth;
  const d = roomDepth;
  const h = wallHeight;

  // Floor & Plinth
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
  floorMesh.position.set(0, -0.1, 0);
  floorMesh.receiveShadow = true;
  houseGroup.add(floorMesh);

  const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.4, d + 0.15), materials.floorPlinth);
  plinthMesh.position.set(0, -0.38, 0);
  houseGroup.add(plinthMesh);

  // Outer Walls
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
  backWall.position.set(0, h / 2, -d / 2 - 0.1);
  houseGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
  leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
  houseGroup.add(leftWall);

  // Modern Framed Art on Back Wall
  const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 0.04), materials.oakDark);
  artFrame.position.set(-1.85, 2.3, -d / 2 + 0.02);
  houseGroup.add(artFrame);

  const artCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.17), new THREE.MeshStandardMaterial({ map: modernArtTex, roughness: 0.8 }));
  artCanvasMesh.position.set(-1.85, 2.3, -d / 2 + 0.045);
  houseGroup.add(artCanvasMesh);

  // Curtains
  const curtainMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.8, 2.8), materials.curtain);
  curtainMesh.position.set(-w / 2 + 0.08, 1.7, -0.8);
  houseGroup.add(curtainMesh);

  // Banquette Living
  const banquetteBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 3.2), materials.oakLight);
  banquetteBase.position.set(-w / 2 + 0.75, 0.19, -0.6);
  banquetteBase.castShadow = true;
  houseGroup.add(banquetteBase);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 2.1), materials.cushionCream);
  seatCushion.position.set(-w / 2 + 0.75, 0.46, -0.9);
  houseGroup.add(seatCushion);

  const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 2.1), materials.cushionCream);
  backCushion.position.set(-w / 2 + 0.32, 0.7, -0.9);
  houseGroup.add(backCushion);

  // Coffee Table
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 1.2), materials.oakLight);
  tableTop.position.set(-1.1, 0.35, 0.2);
  houseGroup.add(tableTop);

  // Pouf
  const poufMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.75), materials.cushionOlive);
  poufMesh.position.set(-1.2, 0.16, 1.3);
  houseGroup.add(poufMesh);

  // Transforming Chair
  chairGroup = new THREE.Group();
  chairGroup.position.set(0.2, 0, 0.6);
  houseGroup.add(chairGroup);
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.46), materials.cushionOlive);
  chairSeat.position.set(0, 0.38, 0);
  chairGroup.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.06), materials.cushionOlive);
  chairBack.position.set(0, 0.64, -0.2);
  chairGroup.add(chairBack);

  // Transforming Joinery Wall (Right)
  const joineryGroup = new THREE.Group();
  houseGroup.add(joineryGroup);

  const JOINERY_X = 2.4;
  const JOINERY_Z = -0.5;
  const frameDepth = 0.9;
  const frameHeight = 2.9;

  const pelmet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, frameDepth + 0.15), materials.oakLight);
  pelmet.position.set(JOINERY_X - 0.2, frameHeight - 0.175, JOINERY_Z);
  joineryGroup.add(pelmet);

  // Murphy Bed
  murphyPivotGroup = new THREE.Group();
  murphyPivotGroup.position.set(JOINERY_X + 0.1, 0.15, JOINERY_Z + frameDepth / 2 - 0.05);
  joineryGroup.add(murphyPivotGroup);

  const BED_WIDTH = 1.65;
  const BED_LENGTH = 2.25;
  const murphyPanel = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH, BED_LENGTH, 0.06), materials.oakLight);
  murphyPanel.position.set(0, BED_LENGTH / 2, 0);
  murphyPivotGroup.add(murphyPanel);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH - 0.14, BED_LENGTH - 0.15, 0.22), materials.bedLinen);
  mattress.position.set(0, BED_LENGTH / 2, -0.12);
  murphyPivotGroup.add(mattress);

  const duvet = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH - 0.12, 1.25, 0.24), materials.bedDuvet);
  duvet.position.set(0, 0.75, -0.13);
  murphyPivotGroup.add(duvet);

  // Fold-out Desk
  deskFoldGroup = new THREE.Group();
  deskFoldGroup.position.set(0, 0.75, 0.04);
  murphyPivotGroup.add(deskFoldGroup);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.58), materials.oakLight);
  deskTop.position.set(0, 0, 0.3);
  deskFoldGroup.add(deskTop);

  const screenDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.42), materials.computerScreen);
  screenDisplay.position.set(0, 0.42, 0.07);
  deskFoldGroup.add(screenDisplay);

  // Sliding Kitchenette
  const kitchenGroup = new THREE.Group();
  kitchenGroup.position.set(0.2, 0, -d / 2 + 0.5);
  houseGroup.add(kitchenGroup);

  const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.88, 0.65), materials.kitchenStone);
  kitchenCounter.position.set(0, 0.44, 0);
  kitchenGroup.add(kitchenCounter);

  slidingPocketDoor = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.5, 0.08), materials.oakLight);
  slidingPocketDoor.position.set(0, 1.25, 0.38);
  kitchenGroup.add(slidingPocketDoor);

  diningLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.75), materials.oakLight);
  diningLeaf.position.set(0, 0.84, 0.72);
  diningLeaf.scale.set(0.001, 1, 0.001);
  kitchenGroup.add(diningLeaf);

  // Projector Screen
  projScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.25), materials.projectorScreen);
  projScreenMesh.position.set(JOINERY_X - 0.75, frameHeight - 0.2 - 1.25 / 2, JOINERY_Z + frameDepth / 2 + 0.13);
  projScreenMesh.scale.set(1, 0.001, 1);
  projScreenMesh.visible = false;
  joineryGroup.add(projScreenMesh);

  projectorGlow = new THREE.PointLight(0xff7733, 0, 5.0, 1.5);
  projectorGlow.position.set(JOINERY_X - 0.75, frameHeight - 0.8, JOINERY_Z + 1.2);
  houseGroup.add(projectorGlow);

  bedReadingLight = new THREE.PointLight(0xffab4c, 0, 3.5);
  bedReadingLight.position.set(JOINERY_X + 0.1, 1.5, JOINERY_Z + 0.2);
  houseGroup.add(bedReadingLight);

  // Floating Zone Badge
  const badgeStudio = createZoneBadge('Micro Studio', '35.4 M² • Adaptive Joinery');
  const spriteStudio = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeStudio, transparent: true, opacity: 0.95 }));
  spriteStudio.scale.set(3.2, 0.98, 1);
  spriteStudio.position.set(0, 2.9, 0);
  houseGroup.add(spriteStudio);
}

// ----------------------------------------------------------------------------
// PLAN BUILDER 3: OPEN INDUSTRIAL LOFT (EXPOSED COLUMN & SPLIT ZONES)
// ----------------------------------------------------------------------------

function buildLoftPlan() {
  const w = roomWidth;
  const d = roomDepth;
  const h = wallHeight;

  // Floor
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
  floorMesh.position.set(0, -0.1, 0);
  floorMesh.receiveShadow = true;
  houseGroup.add(floorMesh);

  const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.4, d + 0.2), materials.floorPlinth);
  plinthMesh.position.set(0, -0.38, 0);
  houseGroup.add(plinthMesh);

  // Outer Walls
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
  backWall.position.set(0, h / 2, -d / 2 - 0.1);
  houseGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
  leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
  houseGroup.add(leftWall);

  // Central Exposed Structural Column
  const column = new THREE.Mesh(new THREE.BoxGeometry(0.55, h, 0.55), materials.charcoalMetal);
  column.position.set(0, h / 2, 0);
  column.castShadow = true;
  houseGroup.add(column);
  activePartitionColliders.push({ x: 0, y: h / 2, z: 0, hx: 0.28, hy: h / 2, hz: 0.28 });

  // Creative Workshop Station (Left Zone)
  const workTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), materials.oakLight);
  workTable.position.set(-2.5, 0.74, -1.5);
  workTable.castShadow = true;
  houseGroup.add(workTable);

  const compScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), materials.computerScreen);
  compScreen.position.set(-2.5, 1.1, -1.75);
  houseGroup.add(compScreen);

  // Elevated Platform Lounge (Right Zone)
  const platform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.2), materials.oakDark);
  platform.position.set(2.4, 0.175, 1.2);
  platform.castShadow = true;
  houseGroup.add(platform);

  const tatamiMattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.8), materials.cushionCream);
  tatamiMattress.position.set(2.4, 0.45, 1.2);
  houseGroup.add(tatamiMattress);

  // Low Japanese Coffee Table on Platform
  const lowTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.65), materials.oakLight);
  lowTable.position.set(2.4, 0.42, -0.6);
  houseGroup.add(lowTable);

  // Floating Zone Badges
  const badgeLoftA = createZoneBadge('Creative Studio', '31.5 M² • Workspace');
  const spriteLoftA = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeLoftA, transparent: true, opacity: 0.95 }));
  spriteLoftA.scale.set(3.0, 0.92, 1);
  spriteLoftA.position.set(-2.5, 3.0, -1.0);
  houseGroup.add(spriteLoftA);

  const badgeLoftB = createZoneBadge('Platform Lounge', '31.5 M² • Resting Wing');
  const spriteLoftB = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeLoftB, transparent: true, opacity: 0.95 }));
  spriteLoftB.scale.set(3.0, 0.92, 1);
  spriteLoftB.position.set(2.5, 3.0, 1.0);
  houseGroup.add(spriteLoftB);
}

// ============================================================================
// DYNAMIC RAPIER PHYSICS OBJECT SPAWNER & EASY-MOVING SELECTION SYSTEM
// ============================================================================

const PROPS_META = {
  'chair-lounge': { name: 'Nordic Minimalist Armchair' },
  'pouf-velvet': { name: 'Modular Ottoman Pouf' },
  'table-coffee': { name: 'Sculptural Marble Coffee Table' },
  'prop-vase': { name: 'Terracotta Sculptural Vase' },
  'prop-plant': { name: 'Fiddle Leaf Fig Planter' },
  'prop-cat': { name: 'Architectural Ceramic Figurine' },
  'crate-wood': { name: 'Nordic Timber Modular Crate' },
  'crate-industrial': { name: 'Industrial Steel Vault Crate' },
  'crate-stack': { name: 'Triple Crate Stack' }
};

// 3D Selection Ring Visual (Floats right on the floor beneath selected object)
const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xdfb15b, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
const selectionRing = new THREE.Mesh(ringGeo, ringMat);
selectionRing.rotation.x = -Math.PI / 2;
selectionRing.position.y = 0.02;
selectionRing.visible = false;
scene.add(selectionRing);

let selectedObject = null;
const transformHud = document.getElementById('item-transform-hud');
const hudItemName = document.getElementById('hud-item-name');

function selectObject(obj) {
  if (!obj) return;
  selectedObject = obj;
  if (hudItemName) hudItemName.textContent = obj.name || 'Selected Piece';
  if (transformHud) {
    transformHud.classList.add('visible');
    transformHud.classList.add('active');
  }
  selectionRing.position.x = obj.mesh.position.x;
  selectionRing.position.z = obj.mesh.position.z;
  selectionRing.visible = true;
  playChime(660);
}

function deselectObject() {
  selectedObject = null;
  if (transformHud) {
    transformHud.classList.remove('visible');
    transformHud.classList.remove('active');
  }
  selectionRing.visible = false;
}

function rotateSelectedObject() {
  if (!selectedObject) return;
  const curRot = selectedObject.body.rotation();
  const curQ = new THREE.Quaternion(curRot.x, curRot.y, curRot.z, curRot.w);
  const rotStep = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
  curQ.multiply(rotStep);
  selectedObject.body.setRotation({ x: curQ.x, y: curQ.y, z: curQ.z, w: curQ.w }, true);
  selectedObject.mesh.quaternion.copy(curQ);
  playChime(740);
}

function dropSettleSelectedObject() {
  if (!selectedObject) return;
  selectedObject.body.setLinvel({ x: 0, y: -0.9, z: 0 }, true);
  selectedObject.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  selectedObject.body.wakeUp();
  playChime(440);
}

function duplicateSelectedObject() {
  if (!selectedObject) return;
  const pos = selectedObject.mesh.position;
  const halfW = roomWidth / 2 - 0.55;
  const halfD = roomDepth / 2 - 0.55;
  const newX = Math.max(-halfW, Math.min(halfW, pos.x + 0.5));
  const newZ = Math.max(-halfD, Math.min(halfD, pos.z + 0.5));

  const clone = spawnPhysicsObject(selectedObject.type, { x: newX, y: pos.y + 0.35, z: newZ });
  if (clone) selectObject(clone);
  playChime(784);
}

function deleteSelectedObject() {
  if (!selectedObject) return;
  scene.remove(selectedObject.mesh);
  selectedObject.mesh.geometry.dispose();
  if (physicsWorld) physicsWorld.removeRigidBody(selectedObject.body);
  const idx = physicsObjects.indexOf(selectedObject);
  if (idx !== -1) physicsObjects.splice(idx, 1);
  deselectObject();
  playChime(330);
}

// Bind Contextual Transform HUD Action Buttons
document.getElementById('hud-rotate-btn').addEventListener('click', rotateSelectedObject);
document.getElementById('hud-drop-btn').addEventListener('click', dropSettleSelectedObject);
document.getElementById('hud-duplicate-btn').addEventListener('click', duplicateSelectedObject);
document.getElementById('hud-delete-btn').addEventListener('click', deleteSelectedObject);
document.getElementById('hud-deselect-btn').addEventListener('click', deselectObject);

function spawnPhysicsObject(type = 'crate-wood', spawnPos = null) {
  if (!physicsWorld) return null;

  const px = spawnPos ? spawnPos.x : (Math.random() - 0.5) * (roomWidth * 0.4);
  const py = spawnPos ? spawnPos.y : 3.0 + Math.random() * 0.4;
  const pz = spawnPos ? spawnPos.z : (Math.random() - 0.5) * (roomDepth * 0.4);

  let mesh = null;
  let colliderDesc = null;
  let bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(px, py, pz);

  if (type === 'crate-wood') {
    const size = 0.55;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), materials.crateWood);
    colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2).setDensity(1.8).setRestitution(0.15);
  } else if (type === 'crate-industrial') {
    const size = 0.5;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), materials.steelBox);
    colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2).setDensity(3.5).setRestitution(0.1);
  } else if (type === 'crate-stack') {
    spawnPhysicsObject('crate-wood', { x: px, y: 1.0, z: pz });
    spawnPhysicsObject('crate-wood', { x: px, y: 1.6, z: pz });
    return spawnPhysicsObject('crate-industrial', { x: px, y: 2.2, z: pz });
  } else if (type === 'chair-lounge') {
    const w = 0.55, h = 0.65, d = 0.55;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials.cushionCream);
    colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(1.2).setRestitution(0.1);
  } else if (type === 'pouf-velvet') {
    const s = 0.6;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(s, 0.35, s), materials.cushionOlive);
    colliderDesc = RAPIER.ColliderDesc.cuboid(s / 2, 0.175, s / 2).setDensity(0.9);
  } else if (type === 'table-coffee') {
    const r = 0.35, h = 0.38;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), materials.oakLight);
    colliderDesc = RAPIER.ColliderDesc.cylinder(h / 2, r).setDensity(1.5);
  } else if (type === 'prop-vase') {
    const r = 0.16, h = 0.42;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 16), materials.potCeramic);
    colliderDesc = RAPIER.ColliderDesc.cylinder(h / 2, r).setDensity(1.1);
  } else if (type === 'prop-plant') {
    const r = 0.22, h = 0.55;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 16), materials.plantLeaf);
    colliderDesc = RAPIER.ColliderDesc.cylinder(h / 2, r).setDensity(0.8);
  } else if (type === 'prop-cat') {
    const w = 0.32, h = 0.28, d = 0.45;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials.cushionTerracotta);
    colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(0.9).setRestitution(0.3);
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rigidBody = physicsWorld.createRigidBody(bodyDesc);
  const collider = physicsWorld.createCollider(colliderDesc, rigidBody);

  const metaName = (PROPS_META[type] && PROPS_META[type].name) || 'Architectural Prop';
  const itemObj = { mesh, body: rigidBody, collider, type, name: metaName };
  physicsObjects.push(itemObj);
  return itemObj;
}

function clearPhysicsObjects() {
  deselectObject();
  physicsObjects.forEach(obj => {
    scene.remove(obj.mesh);
    obj.mesh.geometry.dispose();
    if (physicsWorld) {
      physicsWorld.removeRigidBody(obj.body);
    }
  });
  physicsObjects.length = 0;
}

// Raycast Pointer Physics Dragging & Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedBody = null;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeIntersect = new THREE.Vector3();

window.addEventListener('pointerdown', (e) => {
  if (currentCameraMode === 'walk') return;
  // Ignore clicks on UI overlay panels, HUDs, or modals
  if (e.target.closest('#item-transform-hud') ||
      e.target.closest('.modal') ||
      e.target.closest('.tour-director-modal') ||
      e.target.closest('.panel-drawer') ||
      e.target.closest('.info-drawer') ||
      e.target.closest('.master-mode-switcher-bar') ||
      e.target.closest('.pres-bottom-bar') ||
      e.target.closest('.pres-header') ||
      e.target.closest('.pres-tour-player') ||
      e.target.closest('.pres-spec-modal') ||
      e.target.closest('.top-bar') ||
      e.target.closest('.bottom-bar') ||
      e.target.closest('.quick-toolbar') ||
      e.target.closest('.status-callout') ||
      e.target.closest('.pres-minimap')) {
    return;
  }

  // Smoothly close any open slide-out drawers if clicking into 3D scene
  if (typeof closeAllDrawers === 'function') {
    closeAllDrawers();
  }

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // In Presentation mode, check hotspot clicks first
  if (currentAppMode === 'presentation' && hotspotColliders.length > 0) {
    const hsHits = raycaster.intersectObjects(hotspotColliders);
    if (hsHits.length > 0) {
      const hs = hsHits[0].object.userData.hotspot;
      if (hs) {
        openSpecModal(hs);
        return;
      }
    }
  }

  // In Studio mode, allow clicking and dragging physics objects
  if (currentAppMode === 'studio') {
    const meshes = physicsObjects.map(o => o.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const item = physicsObjects.find(o => o.mesh === hitMesh);
      if (item) {
        selectObject(item);
        draggedBody = item.body;
        controls.enabled = false;
        dragPlane.constant = -intersects[0].point.y;
        return;
      }
    } else {
      // Clicked on empty diorama floor
      deselectObject();
    }
  }
});

window.addEventListener('pointermove', (e) => {
  // Hotspot hover tooltip in Presentation mode
  if (currentAppMode === 'presentation' && currentCameraMode !== 'walk' && hotspotColliders.length > 0) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hsHits = raycaster.intersectObjects(hotspotColliders);
    const tooltip = document.getElementById('hotspot-tooltip');
    if (hsHits.length > 0) {
      document.body.style.cursor = 'pointer';
      const hs = hsHits[0].object.userData.hotspot;
      if (hs && tooltip) {
        document.getElementById('tooltip-title').textContent = hs.title;
        document.getElementById('tooltip-meta').innerHTML = hs.kicker;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
        tooltip.classList.add('visible');
      }
    } else {
      document.body.style.cursor = 'default';
      if (tooltip) tooltip.classList.remove('visible');
    }
  }

  if (!draggedBody) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
    const halfW = roomWidth / 2 - 0.45;
    const halfD = roomDepth / 2 - 0.45;
    const clampedX = Math.max(-halfW, Math.min(halfW, planeIntersect.x));
    const clampedZ = Math.max(-halfD, Math.min(halfD, planeIntersect.z));

    draggedBody.setTranslation({
      x: clampedX,
      y: Math.max(0.3, planeIntersect.y + 0.2),
      z: clampedZ
    }, true);
    draggedBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    draggedBody.wakeUp();

    if (selectionRing) {
      selectionRing.position.set(clampedX, 0.02, clampedZ);
    }
  }
});

window.addEventListener('pointerup', () => {
  if (draggedBody) {
    draggedBody = null;
    controls.enabled = true;
    if (selectedObject) {
      selectedObject.body.wakeUp();
    }
  }
});

// ============================================================================
// CAMERA MODES & FIRST PERSON "MATTERPORT" WALKTHROUGH
// ============================================================================

let currentCameraMode = 'overall';
const walkKeys = { forward: false, backward: false, left: false, right: false };
let walkYaw = 0;
let walkPitch = 0;
let isWalkLooking = false;
let previousPointerX = 0;
let previousPointerY = 0;

window.addEventListener('keydown', (e) => {
  if (currentCameraMode !== 'walk') return;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') walkKeys.forward = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') walkKeys.backward = true;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') walkKeys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') walkKeys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW' || e.code === 'ArrowUp') walkKeys.forward = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') walkKeys.backward = false;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') walkKeys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') walkKeys.right = false;
});

window.addEventListener('mousedown', (e) => {
  if (currentCameraMode === 'walk' && e.button === 0) {
    isWalkLooking = true;
    previousPointerX = e.clientX;
    previousPointerY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isWalkLooking = false;
});

window.addEventListener('mousemove', (e) => {
  if (currentCameraMode === 'walk' && isWalkLooking) {
    const deltaX = e.clientX - previousPointerX;
    const deltaY = e.clientY - previousPointerY;
    previousPointerX = e.clientX;
    previousPointerY = e.clientY;

    walkYaw -= deltaX * 0.0035;
    walkPitch -= deltaY * 0.0035;
    walkPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, walkPitch));
  }
});

function setCameraMode(modeKey) {
  currentCameraMode = modeKey;
  const walkHint = document.getElementById('walk-hint');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === modeKey);
  });

  if (modeKey === 'walk') {
    controls.enabled = false;
    walkHint.classList.add('visible');
    const walkStart = CAMERA_PRESETS.walk.pos;
    camera.position.copy(walkStart);
    walkYaw = 0;
    walkPitch = 0;
  } else {
    controls.enabled = true;
    walkHint.classList.remove('visible');
    const preset = CAMERA_PRESETS[modeKey];
    if (preset) {
      gsap.to(camera.position, { ...preset.pos, duration: 1.4, ease: 'power3.inOut' });
      gsap.to(controls.target, { ...preset.target, duration: 1.4, ease: 'power3.inOut' });
    }
  }
}

// ============================================================================
// CIRCADIAN MODES (WORK, COOK, ENTERTAIN, SLEEP)
// ============================================================================

const MODES = [
  {
    name: 'Work',
    timeStr: '08:30 AM',
    callout: 'Morning focus &bull; Workstation deployed &bull; Natural daylight',
    apply: () => {
      if (currentPlanId === 'studio' && murphyPivotGroup && deskFoldGroup) {
        gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.2, ease: 'power2.inOut' });
        gsap.to(deskFoldGroup.rotation, { x: 0, duration: 1.0, ease: 'back.out(1.4)' });
        materials.computerScreen.emissiveIntensity = 0.85;
        if (chairGroup) gsap.to(chairGroup.position, { x: 2.2, z: 0.75, duration: 1.3 });
        if (slidingPocketDoor) gsap.to(slidingPocketDoor.position, { x: 0, duration: 1.0 });
        if (diningLeaf) gsap.to(diningLeaf.scale, { x: 0.001, z: 0.001, duration: 0.8 });
        if (projScreenMesh) projScreenMesh.visible = false;
      }
    }
  },
  {
    name: 'Cook',
    timeStr: '01:15 PM',
    callout: 'Midday meal &bull; Chef counter &bull; Sun-drenched atmosphere',
    apply: () => {
      if (currentPlanId === 'studio' && murphyPivotGroup && deskFoldGroup) {
        gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.9 });
        gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.0 });
        materials.computerScreen.emissiveIntensity = 0.0;
        if (slidingPocketDoor) gsap.to(slidingPocketDoor.position, { x: -1.45, duration: 1.3 });
        if (diningLeaf) gsap.to(diningLeaf.scale, { x: 1, z: 1, duration: 1.1, delay: 0.3 });
        if (chairGroup) gsap.to(chairGroup.position, { x: 0.2, z: 0.7, duration: 1.2 });
        if (projScreenMesh) projScreenMesh.visible = false;
      }
    }
  },
  {
    name: 'Entertain',
    timeStr: '07:45 PM',
    callout: 'Cinema & social lounge &bull; Golden hour ambient glow',
    apply: () => {
      if (currentPlanId === 'studio' && murphyPivotGroup && deskFoldGroup) {
        gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.0 });
        gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.8 });
        materials.computerScreen.emissiveIntensity = 0.0;
        if (slidingPocketDoor) gsap.to(slidingPocketDoor.position, { x: 0, duration: 1.0 });
        if (diningLeaf) gsap.to(diningLeaf.scale, { x: 0.001, z: 0.001, duration: 0.8 });
        if (projScreenMesh) {
          projScreenMesh.visible = true;
          gsap.to(projScreenMesh.scale, { y: 1.0, duration: 1.4, ease: 'power2.out', delay: 0.2 });
        }
        if (projectorGlow) gsap.to(projectorGlow, { intensity: 2.1, duration: 1.5 });
      }
    }
  },
  {
    name: 'Sleep',
    timeStr: '11:30 PM',
    callout: 'Night rest &bull; Master suite retreat &bull; Warm amber reading lights',
    apply: () => {
      if (currentPlanId === 'studio' && murphyPivotGroup && deskFoldGroup) {
        gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.8 });
        if (projScreenMesh) {
          gsap.to(projScreenMesh.scale, { y: 0.001, duration: 0.8 });
          setTimeout(() => { projScreenMesh.visible = false; }, 800);
        }
        gsap.to(murphyPivotGroup.rotation, { x: Math.PI / 2, duration: 1.5, delay: 0.3 });
        if (bedReadingLight) gsap.to(bedReadingLight, { intensity: 1.9, duration: 1.5, delay: 0.6 });
      }
    }
  }
];

let currentModeIndex = 0;
function setMode(index) {
  currentModeIndex = index;
  const mode = MODES[index];
  document.querySelectorAll('.mode-tab').forEach((tab, i) => tab.classList.toggle('active', i === index));
  document.querySelectorAll('.pres-scen-pill').forEach((pill, i) => pill.classList.toggle('active', i === index));
  const percent = (index / (MODES.length - 1)) * 100;
  document.getElementById('scrubber-progress').style.width = `${percent}%`;
  document.getElementById('scrubber-thumb').style.left = `${percent}%`;
  document.getElementById('time-display').textContent = mode.timeStr;
  document.getElementById('callout-text').innerHTML = mode.callout;
  mode.apply();
}

// ============================================================================
// UI BINDINGS & EVENT LISTENERS
// ============================================================================

// House Plan Layout Switchers (Top bar & CAD Drawer)
document.querySelectorAll('.plan-pill').forEach(btn => {
  btn.addEventListener('click', () => loadHousePlan(btn.dataset.plan));
});

document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', () => loadHousePlan(card.dataset.plan));
});

// Style Switcher
document.querySelectorAll('.style-pill').forEach(btn => {
  btn.addEventListener('click', () => applyStyle(btn.dataset.style));
});

// Camera Views
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => setCameraMode(btn.dataset.view));
});

document.getElementById('exit-walk-btn').addEventListener('click', () => setCameraMode('overall'));

// Timeline & Mode tabs
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => setMode(parseInt(tab.dataset.mode, 10)));
});

document.getElementById('next-btn').addEventListener('click', () => {
  setMode((currentModeIndex + 1) % MODES.length);
});

// Physics Controls
document.getElementById('spawn-crate-btn').addEventListener('click', () => {
  const item = spawnPhysicsObject('crate-wood');
  if (item) selectObject(item);
});

document.getElementById('clear-physics-btn').addEventListener('click', clearPhysicsObjects);

// Slide-Out Drawers & Modals
const catalogDrawer = document.getElementById('catalog-drawer');
const cadDrawer = document.getElementById('cad-drawer');
const infoDrawer = document.getElementById('info-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');

function updateDrawerBackdrop() {
  const isAnyOpen = (catalogDrawer && catalogDrawer.classList.contains('open')) ||
                    (cadDrawer && cadDrawer.classList.contains('open')) ||
                    (infoDrawer && infoDrawer.classList.contains('open'));
  if (drawerBackdrop) {
    drawerBackdrop.classList.toggle('active', isAnyOpen);
  }
}

function closeAllDrawers() {
  if (catalogDrawer) catalogDrawer.classList.remove('open');
  if (cadDrawer) cadDrawer.classList.remove('open');
  if (infoDrawer) infoDrawer.classList.remove('open');
  if (drawerBackdrop) drawerBackdrop.classList.remove('active');
}

if (drawerBackdrop) {
  drawerBackdrop.addEventListener('click', closeAllDrawers);
}

// Catalog Drawer
document.getElementById('open-catalog-btn').addEventListener('click', () => {
  if (cadDrawer) cadDrawer.classList.remove('open');
  if (infoDrawer) infoDrawer.classList.remove('open');
  catalogDrawer.classList.toggle('open');
  updateDrawerBackdrop();
});
document.getElementById('close-catalog-btn').addEventListener('click', () => {
  catalogDrawer.classList.remove('open');
  updateDrawerBackdrop();
});

document.querySelectorAll('.catalog-card').forEach(card => {
  card.addEventListener('click', () => {
    const item = spawnPhysicsObject(card.dataset.spawn);
    if (item) selectObject(item);
  });
});

// Drapery toggles in catalog
document.getElementById('curtain-sheer').addEventListener('click', (e) => {
  materials.curtain.opacity = 0.8;
  materials.curtain.color.set(0xf5f1eb);
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

document.getElementById('curtain-velvet').addEventListener('click', (e) => {
  materials.curtain.opacity = 0.98;
  materials.curtain.color.set(0x3a332d);
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

document.getElementById('curtain-shoji').addEventListener('click', (e) => {
  materials.curtain.opacity = 0.88;
  materials.curtain.color.set(0xf9f5ee);
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

// Parametric Room CAD Drawer
document.getElementById('open-cad-btn').addEventListener('click', () => {
  if (catalogDrawer) catalogDrawer.classList.remove('open');
  if (infoDrawer) infoDrawer.classList.remove('open');
  cadDrawer.classList.toggle('open');
  updateDrawerBackdrop();
});
document.getElementById('close-cad-btn').addEventListener('click', () => {
  cadDrawer.classList.remove('open');
  updateDrawerBackdrop();
});

const widthSlider = document.getElementById('room-width-slider');
const depthSlider = document.getElementById('room-depth-slider');
const heightSlider = document.getElementById('room-height-slider');

function handleCadSliderChange() {
  roomWidth = parseFloat(widthSlider.value);
  roomDepth = parseFloat(depthSlider.value);
  wallHeight = parseFloat(heightSlider.value);
  document.getElementById('val-width').textContent = `${roomWidth.toFixed(1)} m`;
  document.getElementById('val-depth').textContent = `${roomDepth.toFixed(1)} m`;
  document.getElementById('val-height').textContent = `${wallHeight.toFixed(1)} m`;

  const area = (roomWidth * roomDepth).toFixed(1);
  const volume = (roomWidth * roomDepth * wallHeight).toFixed(1);
  document.getElementById('readout-area').innerHTML = `${area} M&sup2;`;
  document.getElementById('readout-volume').innerHTML = `${volume} M&sup3;`;

  // Re-render current plan with modified dimensions
  if (currentPlanId === 'villa') buildVillaPlan();
  else if (currentPlanId === 'studio') buildStudioPlan();
  else buildLoftPlan();

  updatePhysicsBoundaries();
}

widthSlider.addEventListener('input', handleCadSliderChange);
depthSlider.addEventListener('input', handleCadSliderChange);
heightSlider.addEventListener('input', handleCadSliderChange);

document.getElementById('reset-cad-btn').addEventListener('click', () => {
  loadHousePlan(currentPlanId);
});

// Info Modal
document.getElementById('info-btn').addEventListener('click', () => {
  if (catalogDrawer) catalogDrawer.classList.remove('open');
  if (cadDrawer) cadDrawer.classList.remove('open');
  infoDrawer.classList.toggle('open');
  updateDrawerBackdrop();
});
document.getElementById('close-drawer-btn').addEventListener('click', () => {
  infoDrawer.classList.remove('open');
  updateDrawerBackdrop();
});

// ============================================================================
// AUDIO SYSTEM (WEB AUDIO API SYNTHESIZER)
// ============================================================================
let audioCtx = null;
let isAudioEnabled = false;
let ambientGain = null;
let ambientOsc1 = null;
let ambientOsc2 = null;
let lastFootstepTime = 0;

function initAudioEngine() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.22, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  ambientGain.connect(masterGain);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(280, audioCtx.currentTime);
  filter.Q.setValueAtTime(3.2, audioCtx.currentTime);
  filter.connect(ambientGain);

  ambientOsc1 = audioCtx.createOscillator();
  ambientOsc1.type = 'triangle';
  ambientOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2

  ambientOsc2 = audioCtx.createOscillator();
  ambientOsc2.type = 'sine';
  ambientOsc2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3

  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(90, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  ambientOsc1.connect(filter);
  ambientOsc2.connect(filter);

  ambientOsc1.start();
  ambientOsc2.start();
  lfo.start();
}

function setAudioMute(enable) {
  if (enable && !audioCtx) {
    initAudioEngine();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  isAudioEnabled = enable;
  if (ambientGain && audioCtx) {
    ambientGain.gain.cancelScheduledValues(audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(enable ? 0.35 : 0.0001, audioCtx.currentTime + 0.6);
  }
  updateSoundUI();
}

function updateSoundUI() {
  const iconMuted = document.getElementById('sound-icon-muted');
  const iconOn = document.getElementById('sound-icon-on');
  const presIcon = document.getElementById('pres-sound-icon');
  if (iconMuted && iconOn) {
    iconMuted.style.display = isAudioEnabled ? 'none' : 'block';
    iconOn.style.display = isAudioEnabled ? 'block' : 'none';
  }
  if (presIcon) {
    presIcon.textContent = isAudioEnabled ? '🔊' : '🎵';
  }
}

function playChime(freq = 587.33) {
  if (!isAudioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.9);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.9);
}

function triggerFootstepSound() {
  if (!isAudioEnabled || !audioCtx) return;
  const now = performance.now();
  if (now - lastFootstepTime < 380) return;
  lastFootstepTime = now;

  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(85, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 0.08);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(160, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.09);
}

document.getElementById('sound-btn').addEventListener('click', () => setAudioMute(!isAudioEnabled));
document.getElementById('pres-sound-btn').addEventListener('click', () => setAudioMute(!isAudioEnabled));

// ============================================================================
// 3D ARCHITECTURAL HOTSPOTS & MATERIAL SPECIFICATIONS
// ============================================================================
const hotspotsGroup = new THREE.Group();
scene.add(hotspotsGroup);
const hotspotColliders = [];

const HOTSPOTS_DATA = [
  // Villa Hotspots
  {
    id: 'hs-marble',
    plan: 'villa',
    title: 'Calacatta Viola Marble Island',
    kicker: 'NATURAL STONE // GOURMET ISLAND',
    pos: new THREE.Vector3(2.8, 1.15, -1.8),
    narrative: 'Monolithic sculptural kitchen island featuring dramatic burgundy-violet veining on a warm cream ground. Honed matte finish with invisible stain-resistant nanocoating and mitered waterfall edges.',
    prov: 'Carrara, Italy',
    finish: 'Low-Sheen Honed (12 GU)',
    thermal: 'High Thermal Mass Buffer',
    sustain: 'Zero-VOC &bull; EPD Certified',
    camPos: new THREE.Vector3(1.6, 1.6, -2.8),
    camTarget: new THREE.Vector3(2.8, 1.1, -1.8)
  },
  {
    id: 'hs-oak',
    plan: 'villa',
    title: 'French White Oak Chevron Parquet',
    kicker: 'ARCHITECTURAL FLOORING // LIVING SALON',
    pos: new THREE.Vector3(-2.8, 0.22, 0.2),
    narrative: 'Precision 45-degree chevron parquet in sustainably harvested French White Oak. Acoustic underlay dampens footfall while UV-cured oil finish enhances organic grain bounce.',
    prov: 'Burgundy, France',
    finish: 'Natural Ultra-Matte Oil',
    thermal: 'Radiant In-Slab Ready',
    sustain: 'FSC 100% &bull; Low Carbon',
    camPos: new THREE.Vector3(-2.8, 1.25, 1.4),
    camTarget: new THREE.Vector3(-2.8, 0.0, 0.2)
  },
  {
    id: 'hs-partition',
    plan: 'villa',
    title: 'Concealed Kinematic Pocket Portals',
    kicker: 'ADAPTIVE JOINERY // PARTITION SUITE',
    pos: new THREE.Vector3(0, 1.8, -0.75),
    narrative: 'Ceiling-recessed motorized sliding portals with acoustic drop seals. Enables fluid transitions between open entertainment mode and private retreat zones.',
    prov: 'Milan, Italy',
    finish: 'Fluted Smoked Oak & Slate',
    thermal: 'Rw 42 dB Sound Isolation',
    sustain: 'Modular Circular System',
    camPos: new THREE.Vector3(-1.4, 1.7, -0.75),
    camTarget: new THREE.Vector3(0.2, 1.6, -0.75)
  },
  {
    id: 'hs-glazing',
    plan: 'villa',
    title: 'Panoramic Low-E Curtain Wall',
    kicker: 'ARCHITECTURAL ENVELOPE // WEST VISTA',
    pos: new THREE.Vector3(-5.35, 1.8, -1.0),
    narrative: 'Minimalist structural triple-glazing with thermally broken concealed aluminum profiles. Specially calibrated for maximum natural daylight transmittance (94%) with minimal solar heat gain.',
    prov: 'Schüco Engineered',
    finish: 'Anodized Dark Bronze',
    thermal: 'U-Value 0.78 W/m²K',
    sustain: 'Cradle-to-Cradle Silver',
    camPos: new THREE.Vector3(-3.8, 1.8, -1.0),
    camTarget: new THREE.Vector3(-5.5, 1.8, -1.0)
  },
  {
    id: 'hs-bed',
    plan: 'villa',
    title: 'Bespoke Floating King Suite & Headboard',
    kicker: 'PRIVATE SANCTUARY // MASTER SUITE',
    pos: new THREE.Vector3(3.2, 0.85, 2.2),
    narrative: 'Cantilevered platform bed in natural linen upholstery with integrated dimmable reading lights, acoustic fluted headboard paneling, and floating nightstands.',
    prov: 'Atelier Crafted',
    finish: 'Bouclé & Slatted Walnut',
    thermal: 'OEKO-TEX Organic Linen',
    sustain: 'Biodegradable Textiles',
    camPos: new THREE.Vector3(1.8, 1.6, 1.6),
    camTarget: new THREE.Vector3(3.2, 1.0, 2.2)
  },
  // Studio Hotspots
  {
    id: 'hs-murphy',
    plan: 'studio',
    title: 'Kinetic Counterbalanced Wall-Bed',
    kicker: 'TRANSFORMATIVE ARCHITECTURE // MICRO SUITE',
    pos: new THREE.Vector3(2.4, 1.6, -0.8),
    narrative: 'Gas-piston motorized bed assembly that folds flush into architectural millwork, seamlessly converting the sleeping quarter into a morning executive workstation.',
    prov: 'Hafele Hardware Engine',
    finish: 'Light Natural Ash',
    thermal: 'High-Durability Pivot Mechanism',
    sustain: 'Optimized Micro-Living Footprint',
    camPos: new THREE.Vector3(0.6, 1.8, 0.8),
    camTarget: new THREE.Vector3(2.4, 1.4, -0.8)
  },
  {
    id: 'hs-studio-desk',
    plan: 'studio',
    title: 'Ergonomic Fold-Down Workstation',
    kicker: 'WORK INTEGRATION // 08:30 AM FOCUS',
    pos: new THREE.Vector3(2.4, 0.9, 0.7),
    narrative: 'Dual-purpose cantilevered desk with integrated cable management, ambient task lighting, and acoustic fabric backdrop.',
    prov: 'Atelier Studio Custom',
    finish: 'Matte Linoleum & Oak',
    thermal: 'Anti-Static Work Surface',
    sustain: 'FSC Solid Timber Core',
    camPos: new THREE.Vector3(1.2, 1.6, 1.2),
    camTarget: new THREE.Vector3(2.4, 1.0, 0.7)
  },
  // Loft Hotspots
  {
    id: 'hs-column',
    plan: 'loft',
    title: 'Board-Formed Architectural Concrete Column',
    kicker: 'STRUCTURAL CORE // INDUSTRIAL LOFT',
    pos: new THREE.Vector3(0, 1.9, 0),
    narrative: 'Exposed structural brutalist column showing raw timber grain formwork impressions, anchoring the open 63m² creative space.',
    prov: 'Cast-in-Place Structural',
    finish: 'Raw Board-Formed Micro-Plaster',
    thermal: 'Thermal Mass Inertia',
    sustain: 'Low-Carbon Slag Cement Mix',
    camPos: new THREE.Vector3(-1.8, 1.8, 1.8),
    camTarget: new THREE.Vector3(0, 1.8, 0)
  }
];

function buildHotspots() {
  while (hotspotsGroup.children.length > 0) {
    const child = hotspotsGroup.children[0];
    hotspotsGroup.remove(child);
  }
  hotspotColliders.length = 0;

  const currentHotspots = HOTSPOTS_DATA.filter(h => h.plan === currentPlanId);

  const coreGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });

  const innerRingGeo = new THREE.RingGeometry(0.12, 0.16, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xe5b869, side: THREE.DoubleSide });

  const outerRingGeo = new THREE.RingGeometry(0.20, 0.24, 32);
  const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xffe8ab, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });

  const hitGeo = new THREE.SphereGeometry(0.38, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  for (const data of currentHotspots) {
    const beacon = new THREE.Group();
    beacon.position.copy(data.pos);

    const core = new THREE.Mesh(coreGeo, coreMat);
    beacon.add(core);

    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.name = 'innerRing';
    innerRing.rotation.x = -Math.PI / 2;
    beacon.add(innerRing);

    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.name = 'outerRing';
    outerRing.rotation.x = -Math.PI / 2;
    beacon.add(outerRing);

    const collider = new THREE.Mesh(hitGeo, hitMat);
    collider.userData = { hotspot: data };
    beacon.add(collider);
    hotspotColliders.push(collider);

    hotspotsGroup.add(beacon);
  }

  hotspotsGroup.visible = (currentAppMode === 'presentation');
}

function openSpecModal(hs) {
  playChime(659.25);
  const modal = document.getElementById('pres-spec-modal');
  if (!modal) return;

  document.getElementById('spec-card-kicker').innerHTML = hs.kicker;
  document.getElementById('spec-card-title').textContent = hs.title;
  document.getElementById('spec-card-narrative').textContent = hs.narrative;
  document.getElementById('spec-grid-prov').textContent = hs.prov;
  document.getElementById('spec-grid-finish').textContent = hs.finish;
  document.getElementById('spec-grid-thermal').textContent = hs.thermal;
  document.getElementById('spec-grid-sustain').innerHTML = hs.sustain;

  modal.classList.add('open');

  const focusBtn = document.getElementById('spec-focus-cam-btn');
  focusBtn.onclick = () => {
    gsap.to(camera.position, { ...hs.camPos, duration: 1.4, ease: 'power3.inOut' });
    gsap.to(controls.target, { ...hs.camTarget, duration: 1.4, ease: 'power3.inOut' });
  };
}

function closeSpecModal() {
  const modal = document.getElementById('pres-spec-modal');
  if (modal) modal.classList.remove('open');
}

document.getElementById('spec-modal-close').addEventListener('click', closeSpecModal);
document.getElementById('spec-dismiss-btn').addEventListener('click', closeSpecModal);

// ============================================================================
// 3D BIM DIMENSION RULERS (STUDIO MODE)
// ============================================================================
const dimensionsGroup = new THREE.Group();
scene.add(dimensionsGroup);
let showDimensions = false;

function createDimensionText(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(20, 18, 15, 0.88)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 64, 12);
  ctx.fill();
  ctx.strokeStyle = '#e5b869';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 44);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.6, 0.45, 1);
  return sprite;
}

function buildDimensionRulers() {
  while (dimensionsGroup.children.length > 0) {
    const child = dimensionsGroup.children[0];
    dimensionsGroup.remove(child);
  }

  const w = roomWidth;
  const d = roomDepth;
  const h = wallHeight;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xd49b42, linewidth: 2 });

  // Width Dimension Line
  const zOffset = d / 2 + 0.65;
  const wPts = [
    new THREE.Vector3(-w / 2, 0.1, zOffset),
    new THREE.Vector3(w / 2, 0.1, zOffset)
  ];
  const wGeo = new THREE.BufferGeometry().setFromPoints(wPts);
  const wLine = new THREE.Line(wGeo, lineMat);
  dimensionsGroup.add(wLine);

  const tick1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w / 2, 0.1, zOffset - 0.25),
    new THREE.Vector3(-w / 2, 0.1, zOffset + 0.25)
  ]), lineMat);
  const tick2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(w / 2, 0.1, zOffset - 0.25),
    new THREE.Vector3(w / 2, 0.1, zOffset + 0.25)
  ]), lineMat);
  dimensionsGroup.add(tick1);
  dimensionsGroup.add(tick2);

  const wLabel = createDimensionText(`${w.toFixed(2)} m`);
  wLabel.position.set(0, 0.5, zOffset);
  dimensionsGroup.add(wLabel);

  // Depth Dimension Line
  const xOffset = w / 2 + 0.65;
  const dPts = [
    new THREE.Vector3(xOffset, 0.1, -d / 2),
    new THREE.Vector3(xOffset, 0.1, d / 2)
  ];
  const dGeo = new THREE.BufferGeometry().setFromPoints(dPts);
  const dLine = new THREE.Line(dGeo, lineMat);
  dimensionsGroup.add(dLine);

  const tick3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(xOffset - 0.25, 0.1, -d / 2),
    new THREE.Vector3(xOffset + 0.25, 0.1, -d / 2)
  ]), lineMat);
  const tick4 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(xOffset - 0.25, 0.1, d / 2),
    new THREE.Vector3(xOffset + 0.25, 0.1, d / 2)
  ]), lineMat);
  dimensionsGroup.add(tick3);
  dimensionsGroup.add(tick4);

  const dLabel = createDimensionText(`${d.toFixed(2)} m`);
  dLabel.position.set(xOffset, 0.5, 0);
  dimensionsGroup.add(dLabel);

  // Height Dimension Line
  const hPts = [
    new THREE.Vector3(-w / 2 - 0.5, 0, -d / 2 - 0.5),
    new THREE.Vector3(-w / 2 - 0.5, h, -d / 2 - 0.5)
  ];
  const hGeo = new THREE.BufferGeometry().setFromPoints(hPts);
  const hLine = new THREE.Line(hGeo, lineMat);
  dimensionsGroup.add(hLine);

  const hLabel = createDimensionText(`H ${h.toFixed(2)} m`);
  hLabel.position.set(-w / 2 - 0.5, h / 2, -d / 2 - 0.5);
  dimensionsGroup.add(hLabel);

  dimensionsGroup.visible = showDimensions && (currentAppMode === 'studio');
}

const toggleDimBtn = document.getElementById('toggle-dimensions-btn');
if (toggleDimBtn) {
  toggleDimBtn.addEventListener('click', () => {
    showDimensions = !showDimensions;
    toggleDimBtn.classList.toggle('highlight', showDimensions);
    dimensionsGroup.visible = showDimensions && (currentAppMode === 'studio');
  });
}

// ============================================================================
// ATMOSPHERIC LIGHTING & MOOD SYSTEM
// ============================================================================
const ATMOSPHERE_MOODS = {
  day: {
    sunColor: 0xfff6ea,
    sunIntensity: 2.3,
    sunPos: new THREE.Vector3(-10, 14, -5),
    ambientColor: 0xfff8f0,
    ambientIntensity: 1.25,
    bg: 0xd7cfc4,
    ledIntensity: 0.3,
    exposure: 1.08
  },
  sunset: {
    sunColor: 0xff8c38,
    sunIntensity: 3.4,
    sunPos: new THREE.Vector3(-14, 4.2, -4),
    ambientColor: 0x6e4835,
    ambientIntensity: 0.85,
    bg: 0x362520,
    ledIntensity: 2.4,
    exposure: 1.20
  },
  dusk: {
    sunColor: 0x486498,
    sunIntensity: 0.9,
    sunPos: new THREE.Vector3(-12, 2.5, -4),
    ambientColor: 0x222635,
    ambientIntensity: 0.65,
    bg: 0x161824,
    ledIntensity: 3.0,
    exposure: 1.28
  },
  night: {
    sunColor: 0x335599,
    sunIntensity: 0.5,
    sunPos: new THREE.Vector3(-10, 8, -5),
    ambientColor: 0x11131c,
    ambientIntensity: 0.45,
    bg: 0x0c0e14,
    ledIntensity: 3.4,
    exposure: 1.35
  }
};

let currentAtmosphereMood = 'day';

function applyAtmosphereMood(moodKey) {
  currentAtmosphereMood = moodKey;
  const mood = ATMOSPHERE_MOODS[moodKey];
  if (!mood) return;

  playChime(440);

  gsap.to(sunLight.color, { ...new THREE.Color(mood.sunColor), duration: 1.2 });
  gsap.to(sunLight, { intensity: mood.sunIntensity, duration: 1.2 });
  gsap.to(sunLight.position, { ...mood.sunPos, duration: 1.4 });

  gsap.to(ambientLight.color, { ...new THREE.Color(mood.ambientColor), duration: 1.2 });
  gsap.to(ambientLight, { intensity: mood.ambientIntensity, duration: 1.2 });

  materials.warmLed.emissiveIntensity = mood.ledIntensity;
  renderer.toneMappingExposure = mood.exposure;

  scene.background.set(mood.bg);
  scene.fog.color.set(mood.bg);

  document.querySelectorAll('.pres-mood-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mood === moodKey);
  });
}

document.querySelectorAll('.pres-mood-pill').forEach(btn => {
  btn.addEventListener('click', () => applyAtmosphereMood(btn.dataset.mood));
});

// ============================================================================
// ROOM VANTAGE POINT BOOKMARKS
// ============================================================================
const ROOM_BOOKMARKS = {
  villa: {
    entrance: { pos: new THREE.Vector3(-5.2, 1.8, 3.8), target: new THREE.Vector3(-1.2, 1.4, 0), name: 'Grand Entrance' },
    salon: { pos: new THREE.Vector3(-3.4, 1.5, 0.6), target: new THREE.Vector3(-1.0, 1.1, 0.1), name: 'Living Salon' },
    kitchen: { pos: new THREE.Vector3(1.4, 1.8, -3.2), target: new THREE.Vector3(2.8, 1.1, -1.8), name: "Chef's Island" },
    suite: { pos: new THREE.Vector3(1.2, 1.7, 1.8), target: new THREE.Vector3(3.2, 1.1, 2.2), name: 'Master Suite' },
    terrace: { pos: new THREE.Vector3(-3.8, 1.8, -1.0), target: new THREE.Vector3(-5.5, 1.8, -1.0), name: 'Sunset Glazing' },
    dollhouse: { pos: new THREE.Vector3(15.5, 13.5, 14.5), target: new THREE.Vector3(0.5, 1.0, 0), name: '3D Dollhouse' }
  },
  studio: {
    entrance: { pos: new THREE.Vector3(0, 1.7, 2.6), target: new THREE.Vector3(0, 1.3, -0.6), name: 'Studio Entry' },
    salon: { pos: new THREE.Vector3(-1.8, 1.5, 0.8), target: new THREE.Vector3(1.2, 1.3, -0.2), name: 'Transform Lounge' },
    kitchen: { pos: new THREE.Vector3(0.4, 1.6, 0.8), target: new THREE.Vector3(-1.8, 1.2, -0.4), name: 'Chef Counter' },
    suite: { pos: new THREE.Vector3(0.2, 1.6, 1.2), target: new THREE.Vector3(2.0, 1.3, -0.6), name: 'Fold-out Sanctuary' },
    terrace: { pos: new THREE.Vector3(-2.2, 1.8, -1.6), target: new THREE.Vector3(-3.5, 1.8, -1.6), name: 'Window Bay' },
    dollhouse: { pos: new THREE.Vector3(11.0, 9.5, 10.2), target: new THREE.Vector3(0, 1.0, 0), name: 'Studio Dollhouse' }
  },
  loft: {
    entrance: { pos: new THREE.Vector3(-3.8, 1.8, 3.2), target: new THREE.Vector3(0, 1.4, 0), name: 'Loft Threshold' },
    salon: { pos: new THREE.Vector3(-2.2, 1.6, 1.4), target: new THREE.Vector3(1.2, 1.1, 0.6), name: 'Open Living' },
    kitchen: { pos: new THREE.Vector3(1.2, 1.8, -2.4), target: new THREE.Vector3(2.2, 1.2, -1.2), name: 'Monolithic Bar' },
    suite: { pos: new THREE.Vector3(2.0, 1.7, 1.6), target: new THREE.Vector3(3.2, 1.2, 1.8), name: 'Platform Bed' },
    terrace: { pos: new THREE.Vector3(-3.2, 2.0, -2.0), target: new THREE.Vector3(-4.5, 2.0, -2.0), name: 'High Glazing' },
    dollhouse: { pos: new THREE.Vector3(13.8, 11.8, 12.8), target: new THREE.Vector3(0, 1.2, 0), name: 'Loft Diorama' }
  }
};

let currentBookmarkKey = 'entrance';

function goToBookmark(bmKey) {
  currentBookmarkKey = bmKey;
  const planBookmarks = ROOM_BOOKMARKS[currentPlanId] || ROOM_BOOKMARKS.villa;
  const bm = planBookmarks[bmKey];
  if (!bm) return;

  playChime(523.25);

  document.querySelectorAll('.pres-bookmark-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bookmark === bmKey);
  });

  gsap.to(camera.position, { ...bm.pos, duration: 1.6, ease: 'power3.inOut' });
  gsap.to(controls.target, { ...bm.target, duration: 1.6, ease: 'power3.inOut' });
}

document.querySelectorAll('.pres-bookmark-pill').forEach(btn => {
  btn.addEventListener('click', () => goToBookmark(btn.dataset.bookmark));
});

document.querySelectorAll('.pres-scen-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const idx = parseInt(pill.dataset.mode, 10);
    setMode(idx);
  });
});

// ============================================================================
// CINEMATIC AUTOMATED TOUR ENGINE & VIP TOUR DIRECTOR
// ============================================================================
const TOUR_ROUTES = {
  villa: [
    { key: 'entrance', title: 'Grand Arrival & Threshold', desc: 'Welcoming double-height entrance overlooking the entire sunlit diorama, passing into the main salon.', duration: 3.8 },
    { key: 'salon', title: 'Living Salon & Bespoke Seating', desc: 'Curated seating arrangement with Nordic armchairs, wool bouclé upholstery, and fluted joinery.', duration: 3.5 },
    { key: 'kitchen', title: "Gourmet Chef's Island", desc: 'Dramatic Calacatta Viola marble island with integrated concealed induction and ash wood dining.', duration: 3.6 },
    { key: 'suite', title: 'Master Bedroom Retreat', desc: 'Serene sleeping volume with bespoke platform bed, organic linen drapery, and warm indirect LEDs.', duration: 3.6 },
    { key: 'terrace', title: 'Sunset Panoramic Glazing', desc: 'Floor-to-ceiling double-glazed aperture framing radiant golden light across the suite.', duration: 3.8 },
    { key: 'dollhouse', title: 'Architectural Isometric View', desc: 'Elevated cutaway perspective displaying the full spatial zoning and circulation pathways.', duration: 4.0 }
  ],
  studio: [
    { key: 'entrance', title: 'Micro Studio Threshold', desc: 'Compact footprint engineered for maximum light and spatial efficiency.', duration: 3.5 },
    { key: 'salon', title: 'Modular Joinery Core', desc: 'Transformative millwork wall that converts between desk, dining, and bed.', duration: 3.5 },
    { key: 'kitchen', title: 'Integrated Chef Kitchenette', desc: 'Concealed sliding pocket doors reveal a fully functional culinary setup.', duration: 3.5 },
    { key: 'suite', title: 'Kinetic Sleeping Nook', desc: 'Counterbalanced Murphy bed deployed with soft amber reading illumination.', duration: 3.5 },
    { key: 'dollhouse', title: 'Studio 3D Overview', desc: 'Full architectural cutaway of the 35.4 M² adaptive layout.', duration: 3.5 }
  ],
  loft: [
    { key: 'entrance', title: 'Industrial Loft Threshold', desc: 'Spacious high-ceiling entrance framing the exposed concrete structural column.', duration: 3.5 },
    { key: 'salon', title: 'Open Salon & Atelier Workspace', desc: 'Fluid open plan layout supporting both focused creative work and social leisure.', duration: 3.5 },
    { key: 'kitchen', title: 'Monolithic Architectural Bar', desc: 'Charcoal quartz island acting as the social centerpiece of the loft.', duration: 3.5 },
    { key: 'suite', title: 'Platform Lounge Suite', desc: 'Elevated sleeping platform overlooking the double-height industrial glazing.', duration: 3.5 },
    { key: 'dollhouse', title: 'Loft Diorama Cutaway', desc: 'Comprehensive bird-eye view of the 63 M² open industrial volume.', duration: 3.5 }
  ]
};

let isTourActive = false;
let isTourPaused = false;
let tourStepIndex = 0;
let tourTimeout = null;
let tourSpeedModifier = 1.0;
let customTourMoves = [];

function initTourMoves() {
  const defaultRoute = TOUR_ROUTES[currentPlanId] || TOUR_ROUTES.villa;
  const bookmarks = ROOM_BOOKMARKS[currentPlanId] || ROOM_BOOKMARKS.villa;
  customTourMoves = defaultRoute.map((step, idx) => {
    const bm = bookmarks[step.key] || {
      pos: new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z),
      target: new THREE.Vector3(controls.target.x, controls.target.y, controls.target.z)
    };
    return {
      title: step.title,
      desc: step.desc,
      duration: step.duration || 3.5,
      pos: { x: bm.pos.x, y: bm.pos.y, z: bm.pos.z },
      target: { x: bm.target.x, y: bm.target.y, z: bm.target.z },
      key: step.key
    };
  });
  renderTourMovesList();
}

const tourMovesListEl = document.getElementById('tour-moves-list');

function renderTourMovesList() {
  if (!tourMovesListEl) return;
  tourMovesListEl.innerHTML = '';

  if (customTourMoves.length === 0) {
    tourMovesListEl.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--color-silver-muted); font-size: 0.85rem;">No moves in tour sequence. Click "Capture Current View as Move" above to add waypoints!</div>';
    return;
  }

  customTourMoves.forEach((move, idx) => {
    const card = document.createElement('div');
    card.className = 'tour-move-card';
    card.innerHTML = `
      <div class="move-index-badge">${idx + 1}</div>
      <div class="move-info">
        <input type="text" class="move-name-input" value="${move.title}" data-index="${idx}" placeholder="Move name">
        <div class="move-coords">X: ${move.pos.x.toFixed(1)} &bull; Y: ${move.pos.y.toFixed(1)} &bull; Z: ${move.pos.z.toFixed(1)} &bull; ${move.duration}s</div>
      </div>
      <div class="move-actions">
        <button class="move-act-btn preview" data-index="${idx}" title="Preview this camera vantage point">🔭 View</button>
        <button class="move-act-btn update" data-index="${idx}" title="Update this move with current camera position">📷 Update</button>
        <button class="move-act-btn delete" data-index="${idx}" title="Delete move">&times;</button>
      </div>
    `;

    // Title edit
    const input = card.querySelector('.move-name-input');
    input.addEventListener('change', (e) => {
      customTourMoves[idx].title = e.target.value;
    });

    // Preview view
    card.querySelector('.move-act-btn.preview').addEventListener('click', () => {
      gsap.to(camera.position, { ...move.pos, duration: 1.4, ease: 'power2.inOut' });
      gsap.to(controls.target, { ...move.target, duration: 1.4, ease: 'power2.inOut' });
      playChime(580);
    });

    // Update with current camera
    card.querySelector('.move-act-btn.update').addEventListener('click', () => {
      move.pos = { x: parseFloat(camera.position.x.toFixed(2)), y: parseFloat(camera.position.y.toFixed(2)), z: parseFloat(camera.position.z.toFixed(2)) };
      move.target = { x: parseFloat(controls.target.x.toFixed(2)), y: parseFloat(controls.target.y.toFixed(2)), z: parseFloat(controls.target.z.toFixed(2)) };
      renderTourMovesList();
      playChime(784);
    });

    // Delete move
    card.querySelector('.move-act-btn.delete').addEventListener('click', () => {
      customTourMoves.splice(idx, 1);
      renderTourMovesList();
      playChime(350);
    });

    tourMovesListEl.appendChild(card);
  });
}

// Capture current view as tour move
document.getElementById('btn-capture-move').addEventListener('click', () => {
  const moveNumber = customTourMoves.length + 1;
  const newMove = {
    title: `VIP Viewpoint #${moveNumber}`,
    desc: `Custom architectural camera angle captured at (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}).`,
    duration: 3.5,
    pos: {
      x: parseFloat(camera.position.x.toFixed(2)),
      y: parseFloat(camera.position.y.toFixed(2)),
      z: parseFloat(camera.position.z.toFixed(2))
    },
    target: {
      x: parseFloat(controls.target.x.toFixed(2)),
      y: parseFloat(controls.target.y.toFixed(2)),
      z: parseFloat(controls.target.z.toFixed(2))
    }
  };
  customTourMoves.push(newMove);
  renderTourMovesList();
  playChime(880);
});

// Tour Director Modal Controls
const tourDirectorModal = document.getElementById('tour-director-modal');
document.getElementById('pres-tour-director-btn').addEventListener('click', () => {
  if (customTourMoves.length === 0) initTourMoves();
  tourDirectorModal.classList.add('visible');
  tourDirectorModal.classList.add('open');
  renderTourMovesList();
});
document.getElementById('close-tour-dir-btn').addEventListener('click', () => {
  tourDirectorModal.classList.remove('visible');
  tourDirectorModal.classList.remove('open');
});

// Speed pills
document.querySelectorAll('.tour-speed-row .pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tour-speed-row .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tourSpeedModifier = parseFloat(btn.dataset.speed) || 1.0;
  });
});

// Reset signature moves
document.getElementById('btn-reset-default-tour').addEventListener('click', () => {
  initTourMoves();
  playChime(440);
});

// Play custom tour
document.getElementById('btn-play-custom-tour').addEventListener('click', () => {
  tourDirectorModal.classList.remove('visible');
  tourDirectorModal.classList.remove('open');
  startCinematicTour();
});

function startCinematicTour() {
  if (customTourMoves.length === 0) initTourMoves();
  if (customTourMoves.length === 0) return;

  isTourActive = true;
  isTourPaused = false;
  tourStepIndex = 0;

  const player = document.getElementById('pres-tour-player');
  if (player) player.classList.add('active');

  controls.enabled = false;
  executeTourStep();
}

function executeTourStep() {
  if (!isTourActive || isTourPaused) return;
  if (customTourMoves.length === 0) initTourMoves();
  if (customTourMoves.length === 0) return;

  if (tourStepIndex >= customTourMoves.length) {
    tourStepIndex = 0;
  }

  const step = customTourMoves[tourStepIndex];
  if (!step) return;

  const totalMoves = customTourMoves.length;
  document.getElementById('tour-step-badge').textContent = `MOVE ${tourStepIndex + 1} OF ${totalMoves}`;
  document.getElementById('tour-stop-title').textContent = step.title;
  document.getElementById('tour-stop-desc').textContent = step.desc || `Architectural Tour Waypoint ${tourStepIndex + 1}`;

  const progressPercent = ((tourStepIndex + 1) / totalMoves) * 100;
  document.getElementById('tour-progress-bar').style.width = `${progressPercent}%`;

  if (step.key) {
    document.querySelectorAll('.pres-bookmark-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bookmark === step.key);
    });
  }

  const stepDuration = Math.max(1.4, (step.duration || 3.5) / tourSpeedModifier);

  gsap.to(camera.position, { ...step.pos, duration: stepDuration, ease: 'sine.inOut' });
  gsap.to(controls.target, { ...step.target, duration: stepDuration, ease: 'sine.inOut' });

  const dwellTime = (stepDuration + 2.0 / tourSpeedModifier) * 1000;
  clearTimeout(tourTimeout);
  tourTimeout = setTimeout(() => {
    if (isTourActive && !isTourPaused) {
      tourStepIndex++;
      executeTourStep();
    }
  }, dwellTime);
}

function pauseResumeTour() {
  if (!isTourActive) return;
  isTourPaused = !isTourPaused;
  const icon = document.getElementById('tour-play-pause-icon');
  if (icon) icon.textContent = isTourPaused ? '▶️' : '⏸️';
  if (!isTourPaused) executeTourStep();
}

function nextTourStep() {
  if (!isTourActive) return;
  clearTimeout(tourTimeout);
  if (customTourMoves.length === 0) initTourMoves();
  tourStepIndex = (tourStepIndex + 1) % customTourMoves.length;
  executeTourStep();
}

function stopCinematicTour() {
  isTourActive = false;
  clearTimeout(tourTimeout);
  const player = document.getElementById('pres-tour-player');
  if (player) player.classList.remove('active');
  controls.enabled = true;
}

document.getElementById('pres-start-tour-btn').addEventListener('click', startCinematicTour);
document.getElementById('tour-pause-btn').addEventListener('click', pauseResumeTour);
document.getElementById('tour-next-btn').addEventListener('click', nextTourStep);
document.getElementById('tour-close-btn').addEventListener('click', stopCinematicTour);

// ============================================================================
// CINEMA ANAMORPHIC 2.39:1 LETTERBOX
// ============================================================================
let isLetterboxActive = false;

function toggleLetterbox() {
  isLetterboxActive = !isLetterboxActive;
  document.body.classList.toggle('letterbox-active', isLetterboxActive);
  const btn = document.getElementById('pres-letterbox-btn');
  if (btn) btn.classList.toggle('active', isLetterboxActive);
  playChime(isLetterboxActive ? 520 : 390);
}
document.getElementById('pres-letterbox-btn').addEventListener('click', toggleLetterbox);

// ============================================================================
// ARCHITECTURAL BLUEPRINT MINIMAP RADAR
// ============================================================================
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

function drawMinimap() {
  if (!minimapCtx || !minimapCanvas) return;
  const w = minimapCanvas.width;
  const h = minimapCanvas.height;

  minimapCtx.clearRect(0, 0, w, h);

  // Luxury blueprint slate background
  minimapCtx.fillStyle = 'rgba(10, 14, 20, 0.94)';
  minimapCtx.fillRect(0, 0, w, h);

  // Scale calculation
  const padding = 16;
  const scaleX = (w - padding * 2) / (roomWidth || 10);
  const scaleZ = (h - padding * 2) / (roomDepth || 8);
  const scale = Math.min(scaleX, scaleZ);

  const cx = w / 2;
  const cy = h / 2;

  // Grid lines
  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  minimapCtx.lineWidth = 1;
  const step = scale * 2;
  for (let x = cx % step; x < w; x += step) {
    minimapCtx.beginPath();
    minimapCtx.moveTo(x, 0);
    minimapCtx.lineTo(x, h);
    minimapCtx.stroke();
  }
  for (let y = cy % step; y < h; y += step) {
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, y);
    minimapCtx.lineTo(w, y);
    minimapCtx.stroke();
  }

  // Outer Room Boundary
  const rw = (roomWidth || 10) * scale;
  const rd = (roomDepth || 8) * scale;
  minimapCtx.strokeStyle = 'rgba(218, 165, 32, 0.65)';
  minimapCtx.lineWidth = 2;
  minimapCtx.strokeRect(cx - rw / 2, cy - rd / 2, rw, rd);

  // Interior Partitions
  minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (const p of activePartitionColliders) {
    const px = cx + p.x * scale;
    const py = cy + p.z * scale;
    const pw = Math.max(3, p.hx * 2 * scale);
    const ph = Math.max(3, p.hz * 2 * scale);
    minimapCtx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
  }

  // Furniture / Props
  minimapCtx.fillStyle = 'rgba(160, 200, 255, 0.65)';
  for (const obj of physicsObjects) {
    const pos = obj.mesh.position;
    const ox = cx + pos.x * scale;
    const oy = cy + pos.z * scale;
    minimapCtx.beginPath();
    minimapCtx.arc(ox, oy, 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // Camera Viewer Position & FOV Cone
  const camX = cx + camera.position.x * scale;
  const camY = cy + camera.position.z * scale;

  // Camera look direction on XZ plane
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const angle = Math.atan2(camDir.z, camDir.x);
  const fovHalf = ((camera.fov || 50) * Math.PI) / 360;
  const coneLength = 28;

  // Draw FOV Cone
  const grad = minimapCtx.createRadialGradient(camX, camY, 2, camX, camY, coneLength);
  grad.addColorStop(0, 'rgba(223, 177, 91, 0.55)');
  grad.addColorStop(1, 'rgba(223, 177, 91, 0.0)');
  minimapCtx.fillStyle = grad;

  minimapCtx.beginPath();
  minimapCtx.moveTo(camX, camY);
  minimapCtx.arc(camX, camY, coneLength, angle - fovHalf, angle + fovHalf);
  minimapCtx.closePath();
  minimapCtx.fill();

  // Draw Camera Pin Dot
  minimapCtx.fillStyle = '#dfb15b';
  minimapCtx.beginPath();
  minimapCtx.arc(camX, camY, 4, 0, Math.PI * 2);
  minimapCtx.fill();
  minimapCtx.strokeStyle = '#ffffff';
  minimapCtx.lineWidth = 1.5;
  minimapCtx.stroke();
}

// Click Minimap to Glide Camera
if (minimapCanvas) {
  minimapCanvas.addEventListener('click', (e) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const padding = 16;
    const scaleX = (w - padding * 2) / (roomWidth || 10);
    const scaleZ = (h - padding * 2) / (roomDepth || 8);
    const scale = Math.min(scaleX, scaleZ);
    const cx = w / 2;
    const cy = h / 2;

    const targetWorldX = (clickX - cx) / scale;
    const targetWorldZ = (clickY - cy) / scale;

    const halfW = roomWidth / 2 - 0.5;
    const halfD = roomDepth / 2 - 0.5;
    const clampedX = Math.max(-halfW, Math.min(halfW, targetWorldX));
    const clampedZ = Math.max(-halfD, Math.min(halfD, targetWorldZ));

    playChime(620);

    if (currentCameraMode === 'walk') {
      camera.position.x = clampedX;
      camera.position.z = clampedZ;
    } else {
      gsap.to(camera.position, {
        x: clampedX,
        z: clampedZ,
        duration: 1.4,
        ease: 'power2.inOut'
      });
      gsap.to(controls.target, {
        x: clampedX,
        z: clampedZ - 1.5,
        duration: 1.4,
        ease: 'power2.inOut'
      });
    }
  });
}

// ============================================================================
// DUAL MASTER MODES (STUDIO VS CLIENT PRESENTATION)
// ============================================================================
let currentAppMode = 'studio';

function setAppMode(mode) {
  currentAppMode = mode;
  document.body.className = (mode === 'presentation') ? 'mode-presentation' : 'mode-studio';

  document.getElementById('btn-mode-studio').classList.toggle('active', mode === 'studio');
  document.getElementById('btn-mode-presentation').classList.toggle('active', mode === 'presentation');

  if (mode === 'presentation') {
    // Hide all studio drawers & selection hud
    catalogDrawer.classList.remove('open');
    cadDrawer.classList.remove('open');
    infoDrawer.classList.remove('open');
    deselectObject();

    // Show hotspots
    hotspotsGroup.visible = true;
    dimensionsGroup.visible = false;

    // Start audio if enabled
    if (isAudioEnabled) initAudioEngine();

    // Fly to Grand Entrance Bookmark
    goToBookmark('entrance');
  } else {
    // Studio mode
    stopCinematicTour();
    closeSpecModal();
    if (tourDirectorModal) {
      tourDirectorModal.classList.remove('visible');
      tourDirectorModal.classList.remove('open');
    }
    hotspotsGroup.visible = false;
    dimensionsGroup.visible = showDimensions;

    // Return to overall view
    setCameraMode('overall');
  }
}

document.getElementById('btn-mode-studio').addEventListener('click', () => setAppMode('studio'));
document.getElementById('btn-mode-presentation').addEventListener('click', () => setAppMode('presentation'));
document.getElementById('pres-exit-btn').addEventListener('click', () => setAppMode('studio'));

// Client Presentation Walk In
document.getElementById('pres-walkin-btn').addEventListener('click', () => {
  stopCinematicTour();
  closeSpecModal();
  if (tourDirectorModal) {
    tourDirectorModal.classList.remove('visible');
    tourDirectorModal.classList.remove('open');
  }
  setCameraMode('walk');
});

// Fullscreen Presentation Mode
function togglePresentationFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
document.getElementById('pres-fullscreen-btn').addEventListener('click', togglePresentationFullscreen);

// 4K Snapshot Capture
function takePresentationSnapshot() {
  const flash = document.getElementById('snapshot-flash');
  if (flash) {
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 450);
  }
  playChime(880);

  // High-res render to png
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `Wolfitway-Wolf3D-${currentPlanId.toUpperCase()}-${timestamp}.png`;
  link.href = dataUrl;
  link.click();
}
document.getElementById('pres-snapshot-btn').addEventListener('click', takePresentationSnapshot);

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // Ignore shortcuts if typing inside text fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // P: Toggle Studio / Presentation
  if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
    setAppMode(currentAppMode === 'studio' ? 'presentation' : 'studio');
    return;
  }
  // C: Toggle Cinema Anamorphic Letterbox
  if (e.code === 'KeyC' && currentCameraMode !== 'walk') {
    toggleLetterbox();
    return;
  }
  // R: Rotate selected object 45°
  if (e.code === 'KeyR' && currentCameraMode !== 'walk' && selectedObject) {
    rotateSelectedObject();
    return;
  }
  // S: Drop / settle selected object
  if (e.code === 'KeyS' && currentCameraMode !== 'walk' && selectedObject) {
    dropSettleSelectedObject();
    return;
  }
  // D: Duplicate selected object
  if (e.code === 'KeyD' && currentCameraMode !== 'walk' && selectedObject) {
    duplicateSelectedObject();
    return;
  }
  // Delete / Backspace: Remove selected object
  if ((e.code === 'Delete' || e.code === 'Backspace') && selectedObject) {
    deleteSelectedObject();
    return;
  }
  // F: Fullscreen
  if (e.code === 'KeyF' && currentCameraMode !== 'walk') {
    togglePresentationFullscreen();
    return;
  }
  // M: Sound Mute
  if (e.code === 'KeyM') {
    setAudioMute(!isAudioEnabled);
    return;
  }
  // Space: Tour toggle in Presentation Mode
  if (e.code === 'Space' && currentAppMode === 'presentation' && currentCameraMode !== 'walk') {
    e.preventDefault();
    if (isTourActive) pauseResumeTour();
    else startCinematicTour();
    return;
  }
  // Escape: Close modals, drawers, exit tour, deselect object, exit walk
  if (e.code === 'Escape') {
    closeSpecModal();
    if (tourDirectorModal) {
      tourDirectorModal.classList.remove('visible');
      tourDirectorModal.classList.remove('open');
    }
    if (typeof closeAllDrawers === 'function') {
      closeAllDrawers();
    }
    deselectObject();
    if (isTourActive) stopCinematicTour();
    if (currentCameraMode === 'walk') setCameraMode('overall');
  }
});

// ============================================================================
// RENDER LOOP & PHYSICS STEPPING
// ============================================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  // Animate 3D Hotspot Beacons in Presentation Mode
  if (hotspotsGroup.visible) {
    const elapsedTime = clock.getElapsedTime();
    hotspotsGroup.children.forEach((beacon, idx) => {
      const ring = beacon.getObjectByName('innerRing');
      const outer = beacon.getObjectByName('outerRing');
      if (ring) ring.rotation.z += delta * 1.8;
      if (outer) outer.scale.setScalar(1 + 0.15 * Math.sin(elapsedTime * 4 + idx * 1.5));
    });
  }

  // 1. Step Rapier WASM Physics
  if (physicsWorld) {
    physicsWorld.step();

    // Synchronize Three.js meshes with Rapier rigid bodies
    for (let i = 0; i < physicsObjects.length; i++) {
      const obj = physicsObjects[i];
      const translation = obj.body.translation();
      const rotation = obj.body.rotation();
      obj.mesh.position.set(translation.x, translation.y, translation.z);
      obj.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    // Keep selection ring aligned under active prop
    if (selectedObject && selectionRing && selectionRing.visible) {
      selectionRing.position.x = selectedObject.mesh.position.x;
      selectionRing.position.z = selectedObject.mesh.position.z;
    }
  }

  // Draw Interactive Architectural Blueprint Minimap in Presentation Mode
  if (currentAppMode === 'presentation' && typeof drawMinimap === 'function') {
    drawMinimap();
  }

  // 2. Matterport First Person Walk Controller with Doorway Passage & Partition Collision
  if (currentCameraMode === 'walk') {
    const walkSpeed = 3.4; // meters per second
    const moveVector = new THREE.Vector3();

    if (walkKeys.forward) moveVector.z -= 1;
    if (walkKeys.backward) moveVector.z += 1;
    if (walkKeys.left) moveVector.x -= 1;
    if (walkKeys.right) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      triggerFootstepSound();

      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), walkYaw);
      const nextPos = camera.position.clone().addScaledVector(moveVector, walkSpeed * delta);

      // Check collision with partition colliders
      let collided = false;
      const playerRadius = 0.35;
      for (const p of activePartitionColliders) {
        const minX = p.x - p.hx - playerRadius;
        const maxX = p.x + p.hx + playerRadius;
        const minZ = p.z - p.hz - playerRadius;
        const maxZ = p.z + p.hz + playerRadius;

        if (nextPos.x >= minX && nextPos.x <= maxX && nextPos.z >= minZ && nextPos.z <= maxZ) {
          collided = true;
          break;
        }
      }

      if (!collided) {
        camera.position.x = nextPos.x;
        camera.position.z = nextPos.z;
      } else {
        // Attempt sliding along X
        let xBlocked = false;
        for (const p of activePartitionColliders) {
          if (nextPos.x >= p.x - p.hx - playerRadius && nextPos.x <= p.x + p.hx + playerRadius &&
              camera.position.z >= p.z - p.hz - playerRadius && camera.position.z <= p.z + p.hz + playerRadius) {
            xBlocked = true;
            break;
          }
        }
        if (!xBlocked) camera.position.x = nextPos.x;

        // Attempt sliding along Z
        let zBlocked = false;
        for (const p of activePartitionColliders) {
          if (camera.position.x >= p.x - p.hx - playerRadius && camera.position.x <= p.x + p.hx + playerRadius &&
              nextPos.z >= p.z - p.hz - playerRadius && nextPos.z <= p.z + p.hz + playerRadius) {
            zBlocked = true;
            break;
          }
        }
        if (!zBlocked) camera.position.z = nextPos.z;
      }

      // Clamp inside overall house perimeter
      const halfW = roomWidth / 2 - 0.45;
      const halfD = roomDepth / 2 - 0.45;
      camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
      camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
    }

    camera.position.y = 1.65; // Eye height

    const lookDir = new THREE.Vector3(
      Math.sin(walkYaw) * Math.cos(walkPitch),
      Math.sin(walkPitch),
      -Math.cos(walkYaw) * Math.cos(walkPitch)
    );
    camera.lookAt(camera.position.clone().add(lookDir));
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
}

// Start Physics & Render loop
initPhysics().then(() => {
  // Load Default House Plan: Grand Villa Suite (3 Rooms)
  loadHousePlan('villa');

  // Build Hotspots and Dimension Rulers
  buildHotspots();
  buildDimensionRulers();

  // Spawn sample props in the living salon
  spawnPhysicsObject('crate-wood', { x: -1.2, y: 1.8, z: 0.8 });
  spawnPhysicsObject('crate-wood', { x: -1.2, y: 2.6, z: 0.8 });
});

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
