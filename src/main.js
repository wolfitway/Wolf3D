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
scene.fog = new THREE.FogExp2(0xd7cfc4, 0.02);

let roomWidth = 6.8;
let roomDepth = 5.2;
let wallHeight = 3.4;

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const CAMERA_PRESETS = {
  overall: {
    pos: new THREE.Vector3(12.5, 9.8, 11.2),
    target: new THREE.Vector3(0.2, 1.4, -0.2),
  },
  joinery: {
    pos: new THREE.Vector3(5.2, 4.4, 4.2),
    target: new THREE.Vector3(1.8, 2.0, -0.6),
  },
  plan: {
    pos: new THREE.Vector3(0.01, 16.5, 0.01),
    target: new THREE.Vector3(0, 0, 0),
  },
  walk: {
    pos: new THREE.Vector3(0, 1.65, 1.8),
    target: new THREE.Vector3(0, 1.65, -0.5),
  }
};

camera.position.copy(CAMERA_PRESETS.overall.pos);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(CAMERA_PRESETS.overall.target);
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2;
controls.maxDistance = 30;

// ============================================================================
// RAPIER.JS WASM PHYSICS SYSTEM INITIALIZATION
// ============================================================================

let physicsWorld = null;
const physicsObjects = []; // Array of { mesh, body, collider }
let floorCollider = null;
let wallColliders = [];

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

  // Back wall boundary
  const backWallDesc = RAPIER.ColliderDesc.cuboid(roomWidth / 2, wallHeight / 2, 0.1)
    .setTranslation(0, wallHeight / 2, -roomDepth / 2 - 0.1);
  wallColliders.push(physicsWorld.createCollider(backWallDesc));

  // Left wall boundary
  const leftWallDesc = RAPIER.ColliderDesc.cuboid(0.1, wallHeight / 2, roomDepth / 2)
    .setTranslation(-roomWidth / 2 - 0.1, wallHeight / 2, 0);
  wallColliders.push(physicsWorld.createCollider(leftWallDesc));

  // Right wall boundary
  const rightWallDesc = RAPIER.ColliderDesc.cuboid(0.1, wallHeight / 2, roomDepth / 2)
    .setTranslation(roomWidth / 2 + 0.1, wallHeight / 2, 0);
  wallColliders.push(physicsWorld.createCollider(rightWallDesc));
}

// ============================================================================
// PROCEDURAL TEXTURE GENERATION
// ============================================================================

function createSunsetCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#363463');
  grad.addColorStop(0.3, '#734a78');
  grad.addColorStop(0.55, '#d96343');
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
  // Plank borders
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8c633a';
  ctx.strokeRect(4, 4, 248, 248);
  // Cross brace
  ctx.beginPath();
  ctx.moveTo(8, 8); ctx.lineTo(248, 248);
  ctx.moveTo(248, 8); ctx.lineTo(8, 248);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#a47648';
  ctx.stroke();
  // Stamp text
  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
  ctx.fillText('FRAGILE', 70, 135);

  const texture = new THREE.CanvasTexture(canvas);
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
  kitchenStone: new THREE.MeshStandardMaterial({ color: 0x262524, roughness: 0.4 }),
  bedLinen: new THREE.MeshStandardMaterial({ color: 0xf1ece4, roughness: 0.9 }),
  bedDuvet: new THREE.MeshStandardMaterial({ color: 0x3d3936, roughness: 0.85 }),
  plantLeaf: new THREE.MeshStandardMaterial({ color: 0x384a32, roughness: 0.6 }),
  potCeramic: new THREE.MeshStandardMaterial({ color: 0xcbc4b8, roughness: 0.6 }),
  crateWood: new THREE.MeshStandardMaterial({ map: crateWoodTex, roughness: 0.7 }),
  steelBox: new THREE.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.3, metalness: 0.85 }),
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

  // Animate material properties smoothly
  gsap.to(materials.floor.color, { ...new THREE.Color(s.floorColor), duration: 0.8 });
  gsap.to(materials.wall.color, { ...new THREE.Color(s.wallColor), duration: 0.8 });
  gsap.to(materials.oakLight.color, { ...new THREE.Color(s.woodColor), duration: 0.8 });
  gsap.to(materials.cushionCream.color, { ...new THREE.Color(s.cushionColor), duration: 0.8 });
  gsap.to(materials.curtain.color, { ...new THREE.Color(s.curtainColor), duration: 0.8 });
  materials.curtain.opacity = s.curtainOpacity;

  gsap.to(sunLight.color, { ...new THREE.Color(s.sunColor), duration: 0.8 });
  gsap.to(sunLight, { intensity: s.sunIntensity, duration: 0.8 });
  scene.background.set(s.bg);
  scene.fog.color.set(s.bg);

  // Update Style Pills UI
  document.querySelectorAll('.style-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === styleKey);
  });
}

// ============================================================================
// ARCHITECTURAL STRUCTURE & PARAMETRIC SHELL
// ============================================================================

const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Floor Slab
let floorGeo = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth);
const floorMesh = new THREE.Mesh(floorGeo, materials.floor);
floorMesh.position.set(0, -0.1, 0);
floorMesh.receiveShadow = true;
roomGroup.add(floorMesh);

// Dark foundation plinth
let plinthGeo = new THREE.BoxGeometry(roomWidth + 0.15, 0.4, roomDepth + 0.15);
const plinthMesh = new THREE.Mesh(plinthGeo, materials.floorPlinth);
plinthMesh.position.set(0, -0.38, 0);
roomGroup.add(plinthMesh);

// Floor track
const trackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 3.2), materials.track);
trackMesh.position.set(1.1, 0.005, 0.4);
roomGroup.add(trackMesh);

// Back Wall
let backWallGeo = new THREE.BoxGeometry(roomWidth, wallHeight, 0.2);
const backWallMesh = new THREE.Mesh(backWallGeo, materials.wall);
backWallMesh.position.set(0, wallHeight / 2, -roomDepth / 2 - 0.1);
backWallMesh.receiveShadow = true;
roomGroup.add(backWallMesh);

const backWallCap = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.08, 0.24), materials.wallEdge);
backWallCap.position.set(0, wallHeight + 0.04, -roomDepth / 2 - 0.1);
roomGroup.add(backWallCap);

// Left Wall
let leftWallGeo = new THREE.BoxGeometry(0.2, wallHeight, roomDepth);
const leftWallMesh = new THREE.Mesh(leftWallGeo, materials.wall);
leftWallMesh.position.set(-roomWidth / 2 - 0.1, wallHeight / 2, 0);
leftWallMesh.receiveShadow = true;
roomGroup.add(leftWallMesh);

const leftWallCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, roomDepth), materials.wallEdge);
leftWallCap.position.set(-roomWidth / 2 - 0.1, wallHeight + 0.04, 0);
roomGroup.add(leftWallCap);

// Interior door
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.3, 0.04), materials.charcoalMetal);
doorFrame.position.set(-0.6, 1.15, -roomDepth / 2 + 0.01);
roomGroup.add(doorFrame);

const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.24, 0.05), materials.oakLight);
doorLeaf.position.set(-0.6, 1.15, -roomDepth / 2 + 0.02);
roomGroup.add(doorLeaf);

// Modern Framed Art
const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 0.04), materials.oakDark);
artFrame.position.set(-1.85, 2.3, -roomDepth / 2 + 0.02);
roomGroup.add(artFrame);

const artCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.17), new THREE.MeshStandardMaterial({ map: modernArtTex, roughness: 0.8 }));
artCanvasMesh.position.set(-1.85, 2.3, -roomDepth / 2 + 0.045);
roomGroup.add(artCanvasMesh);

// Curtains
const curtainMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.8, 2.8), materials.curtain);
curtainMesh.position.set(-roomWidth / 2 + 0.08, 1.7, -0.8);
roomGroup.add(curtainMesh);

// Function to dynamically rebuild room dimensions (Parametric CAD)
function rebuildRoomDimensions(newW, newD, newH) {
  roomWidth = newW;
  roomDepth = newD;
  wallHeight = newH;

  // Update Geometries
  floorMesh.geometry.dispose();
  floorMesh.geometry = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth);

  plinthMesh.geometry.dispose();
  plinthMesh.geometry = new THREE.BoxGeometry(roomWidth + 0.15, 0.4, roomDepth + 0.15);

  backWallMesh.geometry.dispose();
  backWallMesh.geometry = new THREE.BoxGeometry(roomWidth, wallHeight, 0.2);
  backWallMesh.position.set(0, wallHeight / 2, -roomDepth / 2 - 0.1);

  backWallCap.geometry.dispose();
  backWallCap.geometry = new THREE.BoxGeometry(roomWidth, 0.08, 0.24);
  backWallCap.position.set(0, wallHeight + 0.04, -roomDepth / 2 - 0.1);

  leftWallMesh.geometry.dispose();
  leftWallMesh.geometry = new THREE.BoxGeometry(0.2, wallHeight, roomDepth);
  leftWallMesh.position.set(-roomWidth / 2 - 0.1, wallHeight / 2, 0);

  leftWallCap.geometry.dispose();
  leftWallCap.geometry = new THREE.BoxGeometry(0.24, 0.08, roomDepth);
  leftWallCap.position.set(-roomWidth / 2 - 0.1, wallHeight + 0.04, 0);

  doorFrame.position.z = -roomDepth / 2 + 0.01;
  doorLeaf.position.z = -roomDepth / 2 + 0.02;
  artFrame.position.z = -roomDepth / 2 + 0.02;
  artCanvasMesh.position.z = -roomDepth / 2 + 0.045;
  curtainMesh.position.x = -roomWidth / 2 + 0.08;

  // Update Physics boundaries
  updatePhysicsBoundaries();

  // Update UI Readout
  const area = (roomWidth * roomDepth).toFixed(1);
  const volume = (roomWidth * roomDepth * wallHeight).toFixed(1);
  document.getElementById('room-meta-specs').innerHTML = `STUDIO &bull; ${roomWidth.toFixed(1)} &times; ${roomDepth.toFixed(1)} &bull; ${area} M&sup2;`;
  document.getElementById('readout-area').innerHTML = `${area} M&sup2;`;
  document.getElementById('readout-volume').innerHTML = `${volume} M&sup3;`;
}

// ============================================================================
// LIVING FURNITURE & ADAPTIVE JOINERY
// ============================================================================

const livingGroup = new THREE.Group();
roomGroup.add(livingGroup);

const banquetteBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 3.2), materials.oakLight);
banquetteBase.position.set(-roomWidth / 2 + 0.75, 0.19, -0.6);
banquetteBase.castShadow = true;
livingGroup.add(banquetteBase);

const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 2.1), materials.cushionCream);
seatCushion.position.set(-roomWidth / 2 + 0.75, 0.46, -0.9);
livingGroup.add(seatCushion);

const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 2.1), materials.cushionCream);
backCushion.position.set(-roomWidth / 2 + 0.32, 0.7, -0.9);
livingGroup.add(backCushion);

const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.36), materials.cushionTerracotta);
pillow1.position.set(-roomWidth / 2 + 0.44, 0.65, -0.3);
livingGroup.add(pillow1);

const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.34), materials.cushionCream);
pillow2.position.set(-roomWidth / 2 + 0.44, 0.65, -0.75);
livingGroup.add(pillow2);

const plantLeaves = new THREE.Group();
plantLeaves.position.set(-roomWidth / 2 + 0.65, 0.7, 0.7);
for (let i = 0; i < 7; i++) {
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 5), materials.plantLeaf);
  const ang = (i / 7) * Math.PI * 2;
  leaf.position.set(Math.cos(ang) * 0.1, 0.1, Math.sin(ang) * 0.1);
  leaf.rotation.set(Math.sin(ang) * 0.5, ang, Math.cos(ang) * 0.5);
  plantLeaves.add(leaf);
}
livingGroup.add(plantLeaves);

// Movable Coffee Table
const coffeeTableGroup = new THREE.Group();
coffeeTableGroup.position.set(-1.1, 0, 0.2);
livingGroup.add(coffeeTableGroup);

const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 1.2), materials.oakLight);
tableTop.position.set(0, 0.35, 0);
tableTop.castShadow = true;
coffeeTableGroup.add(tableTop);

for (let x of [-0.36, 0.36]) {
  for (let z of [-0.5, 0.5]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35), materials.charcoalMetal);
    leg.position.set(x, 0.175, z);
    coffeeTableGroup.add(leg);
  }
}

// Pouf & Task Chair
const poufGroup = new THREE.Group();
poufGroup.position.set(-1.2, 0, 1.3);
livingGroup.add(poufGroup);
const poufMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.75), materials.cushionOlive);
poufMesh.position.set(0, 0.16, 0);
poufMesh.castShadow = true;
poufGroup.add(poufMesh);

const chairGroup = new THREE.Group();
chairGroup.position.set(0.2, 0, 0.6);
livingGroup.add(chairGroup);

const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.46), materials.cushionOlive);
chairSeat.position.set(0, 0.38, 0);
chairSeat.castShadow = true;
chairGroup.add(chairSeat);

const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.06), materials.cushionOlive);
chairBack.position.set(0, 0.64, -0.2);
chairGroup.add(chairBack);

// Transforming Joinery Wall (Right)
const joineryGroup = new THREE.Group();
roomGroup.add(joineryGroup);

const JOINERY_X = 2.4;
const JOINERY_Z = -0.5;
const frameDepth = 0.9;
const frameHeight = 2.9;

const pelmet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, frameDepth + 0.15), materials.oakLight);
pelmet.position.set(JOINERY_X - 0.2, frameHeight - 0.175, JOINERY_Z);
joineryGroup.add(pelmet);

const coveLightBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.03, 0.03), materials.warmLed);
coveLightBar.position.set(JOINERY_X - 0.2, frameHeight - 0.36, JOINERY_Z + frameDepth / 2 - 0.05);
joineryGroup.add(coveLightBar);

// Murphy Bed Pivot
const murphyPivotGroup = new THREE.Group();
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
const deskFoldGroup = new THREE.Group();
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
kitchenGroup.position.set(0.2, 0, -roomDepth / 2 + 0.5);
roomGroup.add(kitchenGroup);

const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.88, 0.65), materials.kitchenStone);
kitchenCounter.position.set(0, 0.44, 0);
kitchenGroup.add(kitchenCounter);

const slidingPocketDoor = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.5, 0.08), materials.oakLight);
slidingPocketDoor.position.set(0, 1.25, 0.38);
kitchenGroup.add(slidingPocketDoor);

const diningLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.75), materials.oakLight);
diningLeaf.position.set(0, 0.84, 0.72);
diningLeaf.scale.set(0.001, 1, 0.001);
kitchenGroup.add(diningLeaf);

// Projector Screen
const SCREEN_W = 2.15;
const SCREEN_H = 1.25;
const projScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), materials.projectorScreen);
projScreenMesh.position.set(JOINERY_X - 0.75, frameHeight - 0.2 - SCREEN_H / 2, JOINERY_Z + frameDepth / 2 + 0.13);
projScreenMesh.scale.set(1, 0.001, 1);
projScreenMesh.visible = false;
joineryGroup.add(projScreenMesh);

// Lights
const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.1);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff1dd, 2.2);
sunLight.position.set(-8, 9, -2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0003;
scene.add(sunLight);

const covePointLight = new THREE.PointLight(0xff9d3d, 1.8, 6.5, 1.8);
covePointLight.position.set(JOINERY_X - 0.2, frameHeight - 0.5, JOINERY_Z + 0.5);
scene.add(covePointLight);

const floorWashLight = new THREE.PointLight(0xff8828, 1.5, 4.0, 2.0);
floorWashLight.position.set(JOINERY_X - 0.1, 0.15, JOINERY_Z + 0.6);
scene.add(floorWashLight);

const bedReadingLight = new THREE.PointLight(0xffab4c, 0, 3.5);
bedReadingLight.position.set(JOINERY_X + 0.1, 1.5, JOINERY_Z + 0.2);
scene.add(bedReadingLight);

const projectorGlow = new THREE.PointLight(0xff7733, 0, 5.0, 1.5);
projectorGlow.position.set(JOINERY_X - 0.75, frameHeight - 0.8, JOINERY_Z + 1.2);
scene.add(projectorGlow);

// ============================================================================
// DYNAMIC RAPIER PHYSICS OBJECT SPAWNER
// ============================================================================

function spawnPhysicsObject(type = 'crate-wood', spawnPos = null) {
  if (!physicsWorld) return;

  const px = spawnPos ? spawnPos.x : (Math.random() - 0.5) * 2.0;
  const py = spawnPos ? spawnPos.y : 3.0 + Math.random() * 0.5;
  const pz = spawnPos ? spawnPos.z : (Math.random() - 0.5) * 1.5;

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
    // Spawns 3 stacked boxes in succession
    spawnPhysicsObject('crate-wood', { x: px, y: 1.0, z: pz });
    spawnPhysicsObject('crate-wood', { x: px, y: 1.6, z: pz });
    spawnPhysicsObject('crate-industrial', { x: px, y: 2.2, z: pz });
    return;
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

  physicsObjects.push({ mesh, body: rigidBody, collider });
}

function clearPhysicsObjects() {
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
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const meshes = physicsObjects.map(o => o.mesh);
  const intersects = raycaster.intersectObjects(meshes);
  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    const item = physicsObjects.find(o => o.mesh === hitMesh);
    if (item) {
      draggedBody = item.body;
      controls.enabled = false;
      dragPlane.constant = -intersects[0].point.y;
    }
  }
});

window.addEventListener('pointermove', (e) => {
  if (!draggedBody) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
    draggedBody.setNextKinematicTranslation({
      x: planeIntersect.x,
      y: Math.max(0.3, planeIntersect.y + 0.3),
      z: planeIntersect.z
    });
    draggedBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  }
});

window.addEventListener('pointerup', () => {
  if (draggedBody) {
    draggedBody = null;
    controls.enabled = true;
  }
});

// ============================================================================
// CAMERA MODES & FIRST PERSON "MATTERPORT" WALKTHROUGH
// ============================================================================

let currentCameraMode = 'overall';
const walkKeys = { forward: false, backward: false, left: false, right: false };
const walkVelocity = new THREE.Vector3();
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
    camera.position.set(0, 1.65, 1.8);
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
// CIRCADIAN MODES (01 WORK, 02 COOK, 03 ENTERTAIN, 04 SLEEP)
// ============================================================================

const MODES = [
  {
    name: 'Work',
    timeStr: '08:30 AM',
    callout: 'Morning focus &bull; Workstation deployed &bull; Natural daylight',
    apply: () => {
      gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(deskFoldGroup.rotation, { x: 0, duration: 1.0, ease: 'back.out(1.4)' });
      materials.computerScreen.emissiveIntensity = 0.85;
      gsap.to(chairGroup.position, { x: JOINERY_X - 0.2, z: JOINERY_Z + 1.25, duration: 1.3 });
      gsap.to(chairGroup.rotation, { y: Math.PI, duration: 1.3 });
      gsap.to(slidingPocketDoor.position, { x: 0, duration: 1.0 });
      gsap.to(diningLeaf.scale, { x: 0.001, z: 0.001, duration: 0.8 });
      projScreenMesh.visible = false;
    }
  },
  {
    name: 'Cook',
    timeStr: '01:15 PM',
    callout: 'Midday meal &bull; Pocket wall glides &bull; Kitchenette & dining leaf open',
    apply: () => {
      gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.9 });
      gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.0 });
      materials.computerScreen.emissiveIntensity = 0.0;
      gsap.to(slidingPocketDoor.position, { x: -1.45, duration: 1.3 });
      gsap.to(diningLeaf.scale, { x: 1, z: 1, duration: 1.1, delay: 0.3 });
      gsap.to(chairGroup.position, { x: 0.2, z: 0.7, duration: 1.2 });
      projScreenMesh.visible = false;
    }
  },
  {
    name: 'Entertain',
    timeStr: '07:45 PM',
    callout: 'Cinema lounge &bull; 100" projector lowers &bull; Golden hour ambient glow',
    apply: () => {
      gsap.to(murphyPivotGroup.rotation, { x: 0, duration: 1.0 });
      gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.8 });
      materials.computerScreen.emissiveIntensity = 0.0;
      gsap.to(slidingPocketDoor.position, { x: 0, duration: 1.0 });
      gsap.to(diningLeaf.scale, { x: 0.001, z: 0.001, duration: 0.8 });
      projScreenMesh.visible = true;
      gsap.to(projScreenMesh.scale, { y: 1.0, duration: 1.4, ease: 'power2.out', delay: 0.2 });
      gsap.to(projectorGlow, { intensity: 2.1, duration: 1.5 });
    }
  },
  {
    name: 'Sleep',
    timeStr: '11:30 PM',
    callout: 'Night rest &bull; Queen Murphy bed unfolds &bull; Warm cove reading lights',
    apply: () => {
      gsap.to(deskFoldGroup.rotation, { x: -Math.PI / 2, duration: 0.8 });
      gsap.to(projScreenMesh.scale, { y: 0.001, duration: 0.8 });
      setTimeout(() => { projScreenMesh.visible = false; }, 800);
      gsap.to(murphyPivotGroup.rotation, { x: Math.PI / 2, duration: 1.5, delay: 0.3 });
      gsap.to(bedReadingLight, { intensity: 1.9, duration: 1.5, delay: 0.6 });
    }
  }
];

let currentModeIndex = 0;
function setMode(index) {
  currentModeIndex = index;
  const mode = MODES[index];
  document.querySelectorAll('.mode-tab').forEach((tab, i) => tab.classList.toggle('active', i === index));
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
  spawnPhysicsObject('crate-wood');
});

document.getElementById('clear-physics-btn').addEventListener('click', clearPhysicsObjects);

// Catalog Drawer
const catalogDrawer = document.getElementById('catalog-drawer');
document.getElementById('open-catalog-btn').addEventListener('click', () => catalogDrawer.classList.toggle('open'));
document.getElementById('close-catalog-btn').addEventListener('click', () => catalogDrawer.classList.remove('open'));

document.querySelectorAll('.catalog-card').forEach(card => {
  card.addEventListener('click', () => {
    spawnPhysicsObject(card.dataset.spawn);
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
const cadDrawer = document.getElementById('cad-drawer');
document.getElementById('open-cad-btn').addEventListener('click', () => cadDrawer.classList.toggle('open'));
document.getElementById('close-cad-btn').addEventListener('click', () => cadDrawer.classList.remove('open'));

const widthSlider = document.getElementById('room-width-slider');
const depthSlider = document.getElementById('room-depth-slider');
const heightSlider = document.getElementById('room-height-slider');

function handleCadSliderChange() {
  const w = parseFloat(widthSlider.value);
  const d = parseFloat(depthSlider.value);
  const h = parseFloat(heightSlider.value);
  document.getElementById('val-width').textContent = `${w.toFixed(1)} m`;
  document.getElementById('val-depth').textContent = `${d.toFixed(1)} m`;
  document.getElementById('val-height').textContent = `${h.toFixed(1)} m`;
  rebuildRoomDimensions(w, d, h);
}

widthSlider.addEventListener('input', handleCadSliderChange);
depthSlider.addEventListener('input', handleCadSliderChange);
heightSlider.addEventListener('input', handleCadSliderChange);

document.getElementById('reset-cad-btn').addEventListener('click', () => {
  widthSlider.value = 6.8;
  depthSlider.value = 5.2;
  heightSlider.value = 3.4;
  handleCadSliderChange();
});

// Info Modal
const infoDrawer = document.getElementById('info-drawer');
document.getElementById('info-btn').addEventListener('click', () => infoDrawer.classList.toggle('open'));
document.getElementById('close-drawer-btn').addEventListener('click', () => infoDrawer.classList.remove('open'));

// ============================================================================
// RENDER LOOP & PHYSICS STEPPING
// ============================================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

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
  }

  // 2. Matterport First Person Walk Controller
  if (currentCameraMode === 'walk') {
    const walkSpeed = 3.2; // meters per second
    const moveVector = new THREE.Vector3();

    if (walkKeys.forward) moveVector.z -= 1;
    if (walkKeys.backward) moveVector.z += 1;
    if (walkKeys.left) moveVector.x -= 1;
    if (walkKeys.right) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      // Rotate by walkYaw
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), walkYaw);
      camera.position.addScaledVector(moveVector, walkSpeed * delta);

      // Clamp inside room perimeter
      const halfW = roomWidth / 2 - 0.4;
      const halfD = roomDepth / 2 - 0.4;
      camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
      camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
    }

    camera.position.y = 1.65; // Eye height

    // Orient camera by yaw & pitch
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
  // Pre-spawn two sample wooden cargo crates on launch so the user can play immediately!
  spawnPhysicsObject('crate-wood', { x: -0.4, y: 1.8, z: 0.8 });
  spawnPhysicsObject('crate-wood', { x: -0.4, y: 2.6, z: 0.8 });
});

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
