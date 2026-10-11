import * as THREE from 'three';
import gsap from 'gsap';
import { createGlbFurnitureModel, GLB_MODEL_MAP } from './glbFurnitureLoader.js';

/**
 * Creates high-fidelity, realistic 3D architectural furniture pieces.
 * All models are centered around (0, 0, 0) so their pivot matches the Rapier physics body center.
 * Visual geometry spans from -h/2 (floor surface) to +h/2 (top).
 */

export function createFurnitureMaterials(textures = {}) {
  const cedarTexture = textures.cedar;
  const travertineTexture = textures.travertine;
  const linenTexture = textures.linen;

  return {
    rusticCedar: new THREE.MeshStandardMaterial({
      color: 0xa67448,
      map: cedarTexture || null,
      roughness: 0.65,
      metalness: 0.05
    }),
    darkWalnut: new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      roughness: 0.68,
      metalness: 0.04
    }),
    travertineStone: new THREE.MeshStandardMaterial({
      color: 0xeae0ce,
      map: travertineTexture || null,
      roughness: 0.42,
      metalness: 0.02
    }),
    limewashPlaster: new THREE.MeshStandardMaterial({
      color: 0xf3ede3,
      roughness: 0.88
    }),
    antiqueBrass: new THREE.MeshStandardMaterial({
      color: 0xd4af62,
      roughness: 0.28,
      metalness: 0.88
    }),
    forgedIron: new THREE.MeshStandardMaterial({
      color: 0x22201e,
      roughness: 0.55,
      metalness: 0.75
    }),
    organicLinen: new THREE.MeshStandardMaterial({
      color: 0xebe3d5,
      map: linenTexture || null,
      roughness: 0.92
    }),
    terracottaLinen: new THREE.MeshStandardMaterial({
      color: 0xb55a36,
      roughness: 0.90
    }),
    oliveLinen: new THREE.MeshStandardMaterial({
      color: 0x566249,
      roughness: 0.90
    }),
    terracottaClay: new THREE.MeshStandardMaterial({
      color: 0xb85f39,
      roughness: 0.78,
      metalness: 0.02
    }),
    darkSoil: new THREE.MeshStandardMaterial({
      color: 0x2b221a,
      roughness: 0.95
    }),
    oliveFoliage: new THREE.MeshStandardMaterial({
      color: 0x516447,
      roughness: 0.60
    }),
    oliveFruit: new THREE.MeshStandardMaterial({
      color: 0x292e22,
      roughness: 0.35
    }),
    warmLed: new THREE.MeshStandardMaterial({
      color: 0xffa044,
      emissive: 0xffa044,
      emissiveIntensity: 2.2
    }),
    flutedWood: new THREE.MeshStandardMaterial({
      color: 0xaa784f,
      map: textures.flutedWood || null,
      roughness: 0.65
    }),
    sheerLinen: new THREE.MeshStandardMaterial({
      color: 0xfbf8f3,
      map: textures.curtain || null,
      roughness: 0.95,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    }),
    curtainVelvet: new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.88,
      side: THREE.DoubleSide
    }),
    charcoalWood: new THREE.MeshStandardMaterial({
      color: 0x221f1d,
      roughness: 0.70
    }),
    shadowPlane: new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28
    })
  };
}

/**
 * 1. ARTISAN MEDITERRANEAN 3-DRAWER CREDENZA
 * Dimensions: 1.30m W x 0.84m H x 0.50m D (half-height = 0.42m)
 */
export function buildMediterraneanDrawers(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean 3-Drawer Credenza';

  const w = 1.30;
  const h = 0.84;
  const d = 0.50;
  const legH = 0.14;
  const bodyH = h - legH;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  // Carcass Body Group
  const carcass = new THREE.Group();
  carcass.position.set(0, legH + bodyH / 2, 0);
  pivot.add(carcass);

  // Main cabinet box
  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, d), materials.rusticCedar);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  carcass.add(boxMesh);

  // Top beveled cap slab
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.04, d + 0.04), materials.rusticCedar);
  topCap.position.set(0, bodyH / 2 + 0.02, 0);
  topCap.castShadow = true;
  carcass.add(topCap);

  // 4 Tapered Turned Legs with Brass Ferrules
  const legOffsetW = w / 2 - 0.08;
  const legOffsetD = d / 2 - 0.08;
  const legPositions = [
    [-legOffsetW, legOffsetD],
    [legOffsetW, legOffsetD],
    [-legOffsetW, -legOffsetD],
    [legOffsetW, -legOffsetD]
  ];

  legPositions.forEach(([lx, lz]) => {
    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.016, legH - 0.035, 12), materials.rusticCedar);
    legMesh.position.set(lx, (legH - 0.035) / 2 + 0.035, lz);
    legMesh.castShadow = true;
    pivot.add(legMesh);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.035, 12), materials.antiqueBrass);
    ferrule.position.set(lx, 0.0175, lz);
    pivot.add(ferrule);
  });

  // 3 Drawers
  const drawerList = [];
  const drawerHeights = [0.19, 0.21, 0.23];
  const totalDrawerStackH = drawerHeights.reduce((a, b) => a + b, 0);
  let currentY = -bodyH / 2 + (bodyH - totalDrawerStackH) / 2 + drawerHeights[0] / 2;

  drawerHeights.forEach((dh, idx) => {
    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0, currentY, d / 2);
    carcass.add(drawerGroup);

    const frontW = w - 0.08;
    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(frontW, dh - 0.02, 0.025), materials.rusticCedar);
    frontMesh.position.set(0, 0, 0.0125);
    frontMesh.castShadow = true;
    drawerGroup.add(frontMesh);

    const boxInner = new THREE.Mesh(new THREE.BoxGeometry(frontW - 0.04, dh - 0.04, d * 0.85), materials.darkWalnut);
    boxInner.position.set(0, 0, -d * 0.85 / 2);
    drawerGroup.add(boxInner);

    [-0.28, 0.28].forEach(hx => {
      const backplate = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.005, 12), materials.antiqueBrass);
      backplate.rotation.x = Math.PI / 2;
      backplate.position.set(hx, 0, 0.026);
      drawerGroup.add(backplate);

      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8), materials.antiqueBrass);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(hx, 0, 0.038);
      drawerGroup.add(bar);

      [-0.032, 0.032].forEach(bx => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.014, 8), materials.antiqueBrass);
        post.rotation.x = Math.PI / 2;
        post.position.set(hx + bx, 0, 0.031);
        drawerGroup.add(post);
      });
    });

    drawerList.push(drawerGroup);
    if (idx < drawerHeights.length - 1) {
      currentY += (dh + drawerHeights[idx + 1]) / 2;
    }
  });

  // Top styling: Handcrafted terracotta catchall bowl
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.03, 16), materials.terracottaClay);
  bowl.position.set(-0.35, bodyH / 2 + 0.055, 0);
  carcass.add(bowl);

  // Soft contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, d + 0.3), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  // Drawer Animation Controls
  let areDrawersOpen = false;
  root.userData.hasDrawers = true;
  root.userData.areDrawersOpen = () => areDrawersOpen;
  root.userData.toggleDrawers = (targetOpen = null) => {
    areDrawersOpen = (targetOpen !== null) ? targetOpen : !areDrawersOpen;
    drawerList.forEach((dGroup, i) => {
      const outZ = areDrawersOpen ? (0.28 - i * 0.09) : 0;
      gsap.to(dGroup.position, {
        z: d / 2 + outZ,
        duration: 0.65 + i * 0.08,
        ease: 'power2.out'
      });
    });
    return areDrawersOpen;
  };

  return root;
}

/**
 * 2. RUSTIC MEDITERRANEAN CEDAR DINING TABLE
 * Dimensions: 1.90m W x 0.76m H x 0.95m D (half-height = 0.38m)
 */
export function buildMediterraneanDiningTable(materials) {
  const root = new THREE.Group();
  root.name = 'Rustic Mediterranean Dining Table';

  const w = 1.90;
  const h = 0.76;
  const d = 0.95;
  const topThick = 0.055;
  const legH = h - topThick;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  // Tabletop Planks
  const topGroup = new THREE.Group();
  topGroup.position.set(0, h - topThick / 2, 0);
  pivot.add(topGroup);

  const topMesh = new THREE.Mesh(new THREE.BoxGeometry(w, topThick, d), materials.rusticCedar);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  topGroup.add(topMesh);

  // Apron under-frame
  const apronW = w - 0.22;
  const apronD = d - 0.22;
  const apronH = 0.07;
  const apronMesh = new THREE.Mesh(new THREE.BoxGeometry(apronW, apronH, apronD), materials.rusticCedar);
  apronMesh.position.set(0, h - topThick - apronH / 2, 0);
  apronMesh.castShadow = true;
  pivot.add(apronMesh);

  // 4 Carved Turned Legs
  const legOffsetW = w / 2 - 0.12;
  const legOffsetD = d / 2 - 0.12;
  const legPositions = [
    [-legOffsetW, legOffsetD],
    [legOffsetW, legOffsetD],
    [-legOffsetW, -legOffsetD],
    [legOffsetW, -legOffsetD]
  ];

  legPositions.forEach(([lx, lz]) => {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), materials.rusticCedar);
    collar.position.set(lx, legH - 0.05, lz);
    collar.castShadow = true;
    pivot.add(collar);

    const legCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.026, legH - 0.14, 16), materials.rusticCedar);
    legCyl.position.set(lx, (legH - 0.14) / 2 + 0.04, lz);
    legCyl.castShadow = true;
    pivot.add(legCyl);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.025, 0.04, 16), materials.antiqueBrass);
    ferrule.position.set(lx, 0.02, lz);
    pivot.add(ferrule);
  });

  // Longitudinal Stretcher Bar
  const stretcherZ1 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.24, 0.035, 0.035), materials.rusticCedar);
  stretcherZ1.position.set(0, 0.12, 0);
  stretcherZ1.castShadow = true;
  pivot.add(stretcherZ1);

  // Linen Runner & Fruit Bowl
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.36), materials.organicLinen);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, h + 0.002, 0);
  pivot.add(runner);

  const fruitBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.06, 16), materials.terracottaClay);
  fruitBowl.position.set(0, h + 0.032, 0);
  fruitBowl.castShadow = true;
  pivot.add(fruitBowl);

  // Contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.4, d + 0.4), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 3. TRAVERTINE STONE & CEDAR COFFEE TABLE
 * Dimensions: 1.18m W x 0.38m H x 0.68m D (half-height = 0.19m)
 */
export function buildMediterraneanCoffeeTable(materials) {
  const root = new THREE.Group();
  root.name = 'Travertine Stone Coffee Table';

  const w = 1.18;
  const h = 0.38;
  const d = 0.68;
  const topThick = 0.045;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const stoneTop = new THREE.Mesh(new THREE.BoxGeometry(w, topThick, d), materials.travertineStone);
  stoneTop.position.set(0, h - topThick / 2, 0);
  stoneTop.castShadow = true;
  stoneTop.receiveShadow = true;
  pivot.add(stoneTop);

  [-0.32, 0.32].forEach(px => {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, h - topThick, 24), materials.rusticCedar);
    pedestal.position.set(px, (h - topThick) / 2, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    pivot.add(pedestal);

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24), materials.antiqueBrass);
    ring.position.set(px, h - topThick - 0.01, 0);
    pivot.add(ring);
  });

  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.22), materials.travertineStone);
  tray.position.set(0.18, h + 0.01, 0.05);
  pivot.add(tray);

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16), materials.limewashPlaster);
  candle.position.set(0.18, h + 0.055, 0.05);
  pivot.add(candle);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, d + 0.3), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 4. MEDITERRANEAN LINEN & CEDAR LOUNGE ARMCHAIR
 * Dimensions: 0.82m W x 0.78m H x 0.82m D (half-height = 0.39m)
 */
export function buildMediterraneanArmchair(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean Linen Armchair';

  const w = 0.82;
  const h = 0.78;
  const d = 0.82;
  const seatH = 0.42;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const frame = new THREE.Group();
  pivot.add(frame);

  const legOffsetW = w / 2 - 0.06;
  const legOffsetD = d / 2 - 0.08;

  [-legOffsetW, legOffsetW].forEach(lx => {
    const fLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.48, 12), materials.rusticCedar);
    fLeg.position.set(lx, 0.24, legOffsetD);
    fLeg.castShadow = true;
    frame.add(fLeg);
  });

  [-legOffsetW, legOffsetW].forEach(lx => {
    const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.76, 12), materials.rusticCedar);
    bLeg.position.set(lx, 0.38, -legOffsetD);
    bLeg.rotation.x = -0.12;
    bLeg.castShadow = true;
    frame.add(bLeg);
  });

  [-legOffsetW, legOffsetW].forEach(lx => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, d - 0.08), materials.rusticCedar);
    arm.position.set(lx, 0.52, 0);
    arm.castShadow = true;
    frame.add(arm);
  });

  const seatDeck = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.04, d - 0.14), materials.rusticCedar);
  seatDeck.position.set(0, 0.32, 0);
  frame.add(seatDeck);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, 0.14, d - 0.16), materials.organicLinen);
  seatCushion.position.set(0, seatH, 0.02);
  seatCushion.castShadow = true;
  pivot.add(seatCushion);

  const backCushion = new THREE.Mesh(new THREE.BoxGeometry(w - 0.15, 0.42, 0.12), materials.organicLinen);
  backCushion.position.set(0, 0.62, -d / 2 + 0.15);
  backCushion.rotation.x = -0.16;
  backCushion.castShadow = true;
  pivot.add(backCushion);

  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.10), materials.terracottaLinen);
  pillow.position.set(0, 0.50, -d / 2 + 0.24);
  pillow.rotation.x = -0.22;
  pillow.rotation.y = 0.08;
  pillow.castShadow = true;
  pivot.add(pillow);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, d + 0.2), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 5. MEDITERRANEAN BEDSIDE TABLE / NIGHTSTAND WITH DRAWER
 * Dimensions: 0.56m W x 0.62m H x 0.44m D (half-height = 0.31m)
 */
export function buildMediterraneanNightstand(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean Bedside Drawer Table';

  const w = 0.56;
  const h = 0.62;
  const d = 0.44;
  const topThick = 0.035;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const topMesh = new THREE.Mesh(new THREE.BoxGeometry(w, topThick, d), materials.rusticCedar);
  topMesh.position.set(0, h - topThick / 2, 0);
  topMesh.castShadow = true;
  pivot.add(topMesh);

  const legOffsetW = w / 2 - 0.05;
  const legOffsetD = d / 2 - 0.05;
  const legPositions = [
    [-legOffsetW, legOffsetD],
    [legOffsetW, legOffsetD],
    [-legOffsetW, -legOffsetD],
    [legOffsetW, -legOffsetD]
  ];

  legPositions.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, h - topThick, 12), materials.rusticCedar);
    leg.position.set(lx, (h - topThick) / 2, lz);
    leg.castShadow = true;
    pivot.add(leg);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.03, 12), materials.antiqueBrass);
    ferrule.position.set(lx, 0.015, lz);
    pivot.add(ferrule);
  });

  const boxH = 0.18;
  const boxY = h - topThick - boxH / 2;
  const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, boxH, d - 0.06), materials.rusticCedar);
  drawerBox.position.set(0, boxY, 0);
  pivot.add(drawerBox);

  const drawerGroup = new THREE.Group();
  drawerGroup.position.set(0, boxY, d / 2);
  pivot.add(drawerGroup);

  const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.10, boxH - 0.02, 0.02), materials.rusticCedar);
  frontMesh.position.set(0, 0, 0.01);
  frontMesh.castShadow = true;
  drawerGroup.add(frontMesh);

  const knob = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16), materials.antiqueBrass);
  knob.position.set(0, 0, 0.028);
  drawerGroup.add(knob);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.10, 0.02, d - 0.10), materials.rusticCedar);
  shelf.position.set(0, 0.18, 0);
  pivot.add(shelf);

  const budVase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.09, 16), materials.terracottaClay);
  budVase.position.set(0.12, h + 0.045, 0);
  pivot.add(budVase);

  let isDrawerOpen = false;
  root.userData.hasDrawers = true;
  root.userData.areDrawersOpen = () => isDrawerOpen;
  root.userData.toggleDrawers = (targetOpen = null) => {
    isDrawerOpen = (targetOpen !== null) ? targetOpen : !isDrawerOpen;
    gsap.to(drawerGroup.position, {
      z: d / 2 + (isDrawerOpen ? 0.22 : 0),
      duration: 0.6,
      ease: 'power2.out'
    });
    return isDrawerOpen;
  };

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, d + 0.2), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 6. POTTED MEDITERRANEAN OLIVE TREE
 * Dimensions: 0.70m W x 1.75m H x 0.70m D (half-height = 0.875m)
 */
export function buildMediterraneanOliveTree(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean Potted Olive Tree';

  const h = 1.75;
  const potH = 0.52;
  const potTopR = 0.26;
  const potBottomR = 0.18;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(potTopR, potBottomR, potH, 20), materials.terracottaClay);
  pot.position.set(0, potH / 2, 0);
  pot.castShadow = true;
  pot.receiveShadow = true;
  pivot.add(pot);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(potTopR, 0.024, 12, 24), materials.terracottaClay);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, potH, 0);
  pivot.add(rim);

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(potTopR - 0.02, potTopR - 0.03, 0.04, 20), materials.darkSoil);
  soil.position.set(0, potH - 0.02, 0);
  pivot.add(soil);

  const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.65, 10), materials.darkWalnut);
  trunkBase.position.set(0, potH + 0.32, 0);
  trunkBase.rotation.z = 0.05;
  trunkBase.castShadow = true;
  pivot.add(trunkBase);

  const branchCoords = [
    { x: 0.14, y: potH + 0.85, z: 0.06, rotZ: 0.35, rotX: 0.1, len: 0.45 },
    { x: -0.16, y: potH + 0.95, z: -0.08, rotZ: -0.42, rotX: -0.15, len: 0.50 },
    { x: 0.04, y: potH + 1.15, z: -0.14, rotZ: 0.12, rotX: -0.38, len: 0.42 },
    { x: -0.06, y: potH + 1.25, z: 0.12, rotZ: -0.18, rotX: 0.32, len: 0.40 }
  ];

  branchCoords.forEach(b => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.032, b.len, 8), materials.darkWalnut);
    branch.position.set(b.x / 2, b.y - b.len / 2 + 0.1, b.z / 2);
    branch.rotation.z = b.rotZ;
    branch.rotation.x = b.rotX;
    branch.castShadow = true;
    pivot.add(branch);

    const folSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), materials.oliveFoliage);
    folSphere.scale.set(1.2, 0.85, 1.1);
    folSphere.position.set(b.x * 1.5, b.y + 0.15, b.z * 1.5);
    folSphere.castShadow = true;
    pivot.add(folSphere);

    const olive = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), materials.oliveFruit);
    olive.scale.set(0.9, 1.4, 0.9);
    olive.position.set(b.x * 1.5 + 0.1, b.y + 0.05, b.z * 1.5 - 0.08);
    pivot.add(olive);
  });

  const crownFoliage = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), materials.oliveFoliage);
  crownFoliage.position.set(0, potH + 1.45, 0);
  crownFoliage.castShadow = true;
  pivot.add(crownFoliage);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 7. AUTHENTIC MEDITERRANEAN TERRACOTTA AMPHORA
 * Dimensions: 0.44m W x 0.58m H x 0.38m D (half-height = 0.29m)
 */
export function buildMediterraneanAmphora(materials) {
  const root = new THREE.Group();
  root.name = 'Handcrafted Terracotta Amphora';

  const h = 0.58;
  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.04, 16), materials.terracottaClay);
  base.position.set(0, 0.02, 0);
  pivot.add(base);

  const lowerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.09, 0.22, 18), materials.terracottaClay);
  lowerBody.position.set(0, 0.15, 0);
  lowerBody.castShadow = true;
  pivot.add(lowerBody);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), materials.terracottaClay);
  belly.position.set(0, 0.28, 0);
  belly.scale.set(1.0, 0.85, 1.0);
  belly.castShadow = true;
  pivot.add(belly);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.18, 16), materials.terracottaClay);
  neck.position.set(0, 0.44, 0);
  neck.castShadow = true;
  pivot.add(neck);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 10, 20), materials.terracottaClay);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.53, 0);
  pivot.add(rim);

  [-0.14, 0.14].forEach(hx => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI), materials.terracottaClay);
    handle.position.set(hx, 0.38, 0);
    handle.rotation.z = (hx > 0 ? -Math.PI / 2 : Math.PI / 2);
    handle.castShadow = true;
    pivot.add(handle);
  });

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 8. RUSTIC MEDITERRANEAN DINING CHAIR
 * Dimensions: 0.52m W x 0.88m H x 0.52m D (half-height = 0.44m)
 */
export function buildMediterraneanDiningChair(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean Dining Chair';

  const h = 0.88;
  const seatH = 0.46;
  const w = 0.50;
  const d = 0.50;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const legOffset = 0.19;
  [
    [-legOffset, legOffset],
    [legOffset, legOffset],
    [-legOffset, -legOffset],
    [legOffset, -legOffset]
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, seatH, 12), materials.rusticCedar);
    leg.position.set(lx, seatH / 2, lz);
    leg.castShadow = true;
    pivot.add(leg);
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), materials.rusticCedar);
  frame.position.set(0, seatH - 0.02, 0);
  pivot.add(frame);

  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.06, d - 0.04), materials.organicLinen);
  seatPad.position.set(0, seatH + 0.02, 0);
  seatPad.castShadow = true;
  pivot.add(seatPad);

  [-0.18, 0.18].forEach(ux => {
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 12), materials.rusticCedar);
    upright.position.set(ux, seatH + 0.22, -legOffset);
    upright.castShadow = true;
    pivot.add(upright);
  });

  const crest = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.06, 0.035), materials.rusticCedar);
  crest.position.set(0, seatH + 0.42, -legOffset);
  crest.castShadow = true;
  pivot.add(crest);

  [-0.07, 0, 0.07].forEach(sx => {
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8), materials.rusticCedar);
    spindle.position.set(sx, seatH + 0.20, -legOffset);
    pivot.add(spindle);
  });

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * 9. MEDITERRANEAN WOVEN LINEN POUF
 * Dimensions: 0.62m W x 0.36m H x 0.62m D (half-height = 0.18m)
 */
export function buildMediterraneanPouf(materials) {
  const root = new THREE.Group();
  root.name = 'Mediterranean Woven Linen Pouf';

  const h = 0.36;
  const s = 0.62;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  const poufMesh = new THREE.Mesh(new THREE.CylinderGeometry(s / 2, s / 2 - 0.04, h, 20), materials.organicLinen);
  poufMesh.position.set(0, h / 2, 0);
  poufMesh.castShadow = true;
  poufMesh.receiveShadow = true;
  pivot.add(poufMesh);

  // Leather seam trim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(s / 2, 0.015, 8, 20), materials.darkWalnut);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, h, 0);
  pivot.add(rim);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(s + 0.2, s + 0.2), materials.shadowPlane);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0);
  pivot.add(shadow);

  return root;
}

/**
 * Helper to build realistic 3D undulating S-Fold / Ripplefold drapery mesh
 */
function createRipplefoldMesh(width, height, waves, amplitude, material, flare = 0.02) {
  const segX = Math.max(32, Math.round(waves * 8));
  const segY = 16;
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Smooth sinusoidal wave along X axis
    const zWave = Math.sin(((x + width / 2) / width) * waves * Math.PI * 2) * amplitude;
    // Floor pooling flare at the bottom edge
    const poolRatio = 1 - Math.min(1, Math.max(0, (y + height / 2) / (height * 0.25)));
    const zFlare = poolRatio * flare;
    pos.setZ(i, zWave + zFlare);
  }

  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * 10. ARTISAN MEDITERRANEAN PLATFORM KING BED
 * Masterpiece multi-component model with fluted upholstered headboard,
 * platform base, deep layered mattress, voluminous folded duvet, throw runner,
 * stacked ergonomic pillows, and cantilevered nightstands with reading lamps.
 * Dimensions: 2.15m W x 1.15m H x 2.25m D (half-height = 0.575m)
 */
export function buildMediterraneanBed(materials) {
  const root = new THREE.Group();
  root.name = 'Artisan Mediterranean Platform King Bed';

  const w = 2.15;
  const h = 1.15;
  const d = 2.25;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  // 1. Recessed Floating Plinth (Blackened Steel Shadow Base)
  const shadowPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.10, 1.95),
    materials.forgedIron || materials.charcoalWood
  );
  shadowPlinth.position.set(0, 0.05, 0.05);
  shadowPlinth.receiveShadow = true;
  pivot.add(shadowPlinth);

  // 2. Solid Aged Cedar Platform Base Frame
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.18, 2.12),
    materials.rusticCedar
  );
  platform.position.set(0, 0.19, 0.05);
  platform.castShadow = true;
  platform.receiveShadow = true;
  pivot.add(platform);

  // Platform perimeter bevel trim rail
  const footRail = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 0.06, 0.08),
    materials.rusticCedar
  );
  footRail.position.set(0, 0.28, 1.09);
  footRail.castShadow = true;
  pivot.add(footRail);

  // 4 Corner Turned Tapered Feet with Brass Ferrules
  const footCoords = [
    [-0.96, 0.98],
    [0.96, 0.98],
    [-0.96, -0.88],
    [0.96, -0.88]
  ];
  footCoords.forEach(([fx, fz]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.022, 0.10, 12),
      materials.rusticCedar
    );
    leg.position.set(fx, 0.05, fz);
    leg.castShadow = true;
    pivot.add(leg);

    const ferrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.022, 0.03, 12),
      materials.antiqueBrass
    );
    ferrule.position.set(fx, 0.015, fz);
    pivot.add(ferrule);
  });

  // 3. Cantilevered Floating Side Nightstands
  [-1.16, 1.16].forEach((nx, idx) => {
    // Floating cedar ledge
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.04, 0.32),
      materials.rusticCedar
    );
    shelf.position.set(nx, 0.32, -0.62);
    shelf.castShadow = true;
    pivot.add(shelf);

    // Brass front edge trim
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.015, 0.015),
      materials.antiqueBrass
    );
    trim.position.set(nx, 0.32, -0.46);
    pivot.add(trim);

    // Bedside Reading Lamp
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16),
      materials.antiqueBrass
    );
    lampBase.position.set(nx, 0.346, -0.62);
    pivot.add(lampBase);

    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.22, 12),
      materials.antiqueBrass
    );
    lampStem.position.set(nx, 0.45, -0.62);
    pivot.add(lampStem);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.09, 16),
      materials.antiqueBrass
    );
    lampShade.position.set(nx, 0.54, -0.62);
    lampShade.rotation.z = idx === 0 ? 0.2 : -0.2;
    pivot.add(lampShade);

    const bulbGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 12),
      materials.warmLed
    );
    bulbGlow.position.set(nx, 0.52, -0.62);
    pivot.add(bulbGlow);
  });

  // 4. Architectural Upholstered Headboard
  const headboardGroup = new THREE.Group();
  headboardGroup.position.set(0, 0, -1.02);
  pivot.add(headboardGroup);

  // Solid cedar backing frame
  const hbFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.90, 0.08),
    materials.rusticCedar
  );
  hbFrame.position.set(0, 0.65, 0);
  hbFrame.castShadow = true;
  headboardGroup.add(hbFrame);

  // Sculpted top cap rail
  const hbTopCap = new THREE.Mesh(
    new THREE.BoxGeometry(2.20, 0.06, 0.12),
    materials.rusticCedar
  );
  hbTopCap.position.set(0, 1.12, 0);
  hbTopCap.castShadow = true;
  headboardGroup.add(hbTopCap);

  // Warm Hidden LED Cove Lighting along headboard top
  const hbLed = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 0.02, 0.025),
    materials.warmLed
  );
  hbLed.position.set(0, 1.145, 0.02);
  headboardGroup.add(hbLed);

  // 6 Vertical Fluted Oatmeal Linen Cushioned Channels
  const numChannels = 6;
  const channelW = 0.31;
  const channelH = 0.76;
  const channelGap = 0.02;
  const startX = -((numChannels - 1) * (channelW + channelGap)) / 2;

  for (let c = 0; c < numChannels; c++) {
    const cx = startX + c * (channelW + channelGap);
    const channelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(channelW, channelH, 0.09),
      materials.organicLinen
    );
    channelMesh.position.set(cx, 0.67, 0.05);
    channelMesh.castShadow = true;
    channelMesh.receiveShadow = true;
    headboardGroup.add(channelMesh);

    // Vertical seam highlight bead
    const bead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, channelH, 8),
      materials.antiqueBrass
    );
    bead.position.set(cx + channelW / 2 + channelGap / 2, 0.67, 0.065);
    if (c < numChannels - 1) headboardGroup.add(bead);
  }

  // 5. Deep Plush Layered Mattress
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 0.25, 1.96),
    materials.organicLinen
  );
  mattress.position.set(0, 0.40, 0.05);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  pivot.add(mattress);

  // Mattress top perimeter welting piping
  const pipeZ = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.02, 0.02), materials.organicLinen);
  pipeZ.position.set(0, 0.525, 1.02);
  pivot.add(pipeZ);

  // 6. Voluminous Folded Duvet / Comforter
  const duvetMain = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.16, 1.40),
    materials.darkWalnut
  );
  duvetMain.position.set(0, 0.46, 0.33);
  duvetMain.castShadow = true;
  pivot.add(duvetMain);

  // Draped side overhangs
  [-0.94, 0.94].forEach(dx => {
    const drapeSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.19, 1.38),
      materials.darkWalnut
    );
    drapeSide.position.set(dx, 0.38, 0.33);
    pivot.add(drapeSide);
  });

  // Folded-back top fold revealing crisp linen lining
  const duvetFold = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.08, 0.28),
    materials.organicLinen
  );
  duvetFold.position.set(0, 0.49, -0.40);
  duvetFold.castShadow = true;
  pivot.add(duvetFold);

  // 7. Folded Waffle Throw Blanket / Runner (Terracotta)
  const throwRunner = new THREE.Mesh(
    new THREE.BoxGeometry(1.88, 0.04, 0.46),
    materials.terracottaLinen
  );
  throwRunner.position.set(0, 0.55, 0.76);
  throwRunner.castShadow = true;
  pivot.add(throwRunner);

  // 8. Ergonomic Sleeping & Accent Pillows
  // Two King sleeping pillows propped at 22°
  [-0.44, 0.44].forEach(px => {
    const kingPillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.70, 0.15, 0.40),
      materials.organicLinen
    );
    kingPillow.position.set(px, 0.57, -0.72);
    kingPillow.rotation.x = 0.36;
    kingPillow.castShadow = true;
    pivot.add(kingPillow);
  });

  // Left Euro Cushion (Olive Linen)
  const euroLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.44, 0.13),
    materials.oliveLinen
  );
  euroLeft.position.set(-0.42, 0.59, -0.54);
  euroLeft.rotation.set(0.42, 0.12, 0);
  euroLeft.castShadow = true;
  pivot.add(euroLeft);

  // Right Euro Cushion (Terracotta Linen)
  const euroRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.44, 0.13),
    materials.terracottaLinen
  );
  euroRight.position.set(0.42, 0.59, -0.54);
  euroRight.rotation.set(0.42, -0.12, 0);
  euroRight.castShadow = true;
  pivot.add(euroRight);

  // Centered Lumbar Bolster Pillow
  const bolster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.64, 16),
    materials.organicLinen
  );
  bolster.position.set(0, 0.50, -0.34);
  bolster.rotation.z = Math.PI / 2;
  bolster.castShadow = true;
  pivot.add(bolster);

  [-0.32, 0.32].forEach(bx => {
    const tuft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12),
      materials.antiqueBrass
    );
    tuft.position.set(bx, 0.50, -0.34);
    tuft.rotation.z = Math.PI / 2;
    pivot.add(tuft);
  });

  // Soft Ambient Ground Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.3, d + 0.2),
    materials.shadowPlane
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.003, 0.05);
  pivot.add(shadow);

  return root;
}

/**
 * 11. BESPOKE RIPPLEFOLD LINEN DRAPERY & ANTIQUE BRASS ROD
 * Architectural window treatment with real 3D undulating wave folds,
 * heavy antique brass rod, lathed finials, mounting brackets, rings,
 * inner translucent sheer gauze panel, and outer gathered side drapes.
 */
export function buildArchitecturalCurtains(options = {}, materials) {
  const root = new THREE.Group();
  root.name = 'Bespoke Ripplefold Linen Drapery';

  const w = options.width || 3.60;
  const h = options.height || 2.90;
  const rodOverhang = 0.25;
  const rodLen = w + rodOverhang * 2;

  const pivot = new THREE.Group();
  pivot.position.y = -h / 2;
  root.add(pivot);

  // 1. Heavy Gauge Antique Brass Curtain Rod
  const rodMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, rodLen, 16),
    materials.antiqueBrass
  );
  rodMesh.rotation.z = Math.PI / 2;
  rodMesh.position.set(0, h - 0.05, 0.06);
  rodMesh.castShadow = true;
  pivot.add(rodMesh);

  // Decorative Lathed Cylinder Finials at both ends
  [-rodLen / 2, rodLen / 2].forEach(fx => {
    const finial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.022, 0.06, 16),
      materials.antiqueBrass
    );
    finial.rotation.z = Math.PI / 2;
    finial.position.set(fx, h - 0.05, 0.06);
    pivot.add(finial);

    const finialBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 12, 12),
      materials.antiqueBrass
    );
    finialBall.position.set(fx + (fx > 0 ? 0.035 : -0.035), h - 0.05, 0.06);
    pivot.add(finialBall);
  });

  // 3 Heavy Duty Wall Mounting Brackets (Left, Center, Right)
  [-w / 2, 0, w / 2].forEach(bx => {
    const bracketStem = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.045, 0.12),
      materials.antiqueBrass
    );
    bracketStem.position.set(bx, h - 0.05, 0.0);
    pivot.add(bracketStem);

    // Wall mounting plate
    const escutcheon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16),
      materials.antiqueBrass
    );
    escutcheon.rotation.x = Math.PI / 2;
    escutcheon.position.set(bx, h - 0.05, -0.06);
    pivot.add(escutcheon);
  });

  // 24 Drapery Rings Along the Rod
  const ringCount = 24;
  for (let r = 0; r < ringCount; r++) {
    const rx = -w / 2 + (r / (ringCount - 1)) * w;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.0035, 8, 16),
      materials.antiqueBrass
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.set(rx, h - 0.05, 0.06);
    pivot.add(ring);
  }

  // 2. Inner Translucent Sheer Gauze Panel with Gentle 3D Ripples
  const sheerMaterial = materials.sheerLinen || materials.curtain || materials.organicLinen;
  const sheerH = h - 0.12;
  const sheerMesh = createRipplefoldMesh(w * 0.96, sheerH, 12, 0.035, sheerMaterial, 0.012);
  sheerMesh.position.set(0, sheerH / 2, 0.04);
  pivot.add(sheerMesh);

  // 3. Heavy Architectural Outer Drapery Panels (Left & Right Gathered Drapes)
  const outerMaterial = materials.organicLinen || materials.curtain;
  const panelW = w * 0.32;
  const outerH = h - 0.08;

  // Left Gathered Drape Panel
  const leftPanel = createRipplefoldMesh(panelW, outerH, 5, 0.065, outerMaterial, 0.025);
  leftPanel.position.set(-w / 2 + panelW / 2 + 0.04, outerH / 2, 0.09);
  pivot.add(leftPanel);

  // Right Gathered Drape Panel
  const rightPanel = createRipplefoldMesh(panelW, outerH, 5, 0.065, outerMaterial, 0.025);
  rightPanel.position.set(w / 2 - panelW / 2 - 0.04, outerH / 2, 0.09);
  pivot.add(rightPanel);

  // Antique Brass Tieback Hooks & Bands at Mid-Height
  [-w / 2 + 0.02, w / 2 - 0.02].forEach(tx => {
    const tiebackHook = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12),
      materials.antiqueBrass
    );
    tiebackHook.rotation.z = Math.PI / 2;
    tiebackHook.position.set(tx, 1.15, 0.10);
    pivot.add(tiebackHook);

    const tiebackRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.005, 8, 16),
      materials.antiqueBrass
    );
    tiebackRing.position.set(tx, 1.15, 0.11);
    pivot.add(tiebackRing);
  });

  return root;
}

/**
 * Internal procedural fallback builder in case of network or format delay
 */
function buildProceduralFallback(type, materials) {
  switch (type) {
    case 'bed-king':
    case 'med-bed':
    case 'bed':
      return buildMediterraneanBed(materials);

    case 'med-drawers':
    case 'drawers':
      return buildMediterraneanDrawers(materials);

    case 'table-dining':
    case 'med-dining-table':
      return buildMediterraneanDiningTable(materials);

    case 'table-coffee':
    case 'med-coffee-table':
      return buildMediterraneanCoffeeTable(materials);

    case 'chair-lounge':
    case 'med-chair-lounge':
      return buildMediterraneanArmchair(materials);

    case 'chair-dining':
    case 'med-chair-dining':
      return buildMediterraneanDiningChair(materials);

    case 'nightstand-drawer':
    case 'med-nightstand':
      return buildMediterraneanNightstand(materials);

    case 'prop-plant':
    case 'med-olive-tree':
      return buildMediterraneanOliveTree(materials);

    case 'prop-vase':
    case 'med-amphora':
      return buildMediterraneanAmphora(materials);

    case 'pouf-velvet':
    case 'med-pouf':
      return buildMediterraneanPouf(materials);

    default:
      if (type.includes('bed')) return buildMediterraneanBed(materials);
      if (type.includes('drawer')) return buildMediterraneanDrawers(materials);
      if (type.includes('table')) return buildMediterraneanCoffeeTable(materials);
      if (type.includes('chair')) return buildMediterraneanArmchair(materials);
      return buildMediterraneanDrawers(materials);
  }
}

/**
 * Factory dispatch to construct any furniture prop group.
 * High-fidelity Blender GLB models are loaded and instanced directly.
 */
export function buildFurnitureModel(type, materials) {
  // Architectural Ripplefold Drapery is procedural
  if (type === 'curtain-drape' || type === 'med-curtains' || type === 'curtains' || type === 'curtain') {
    return buildArchitecturalCurtains({}, materials);
  }

  // Check if we have an authentic Blender GLB model for this piece
  if (GLB_MODEL_MAP[type]) {
    return createGlbFurnitureModel(type, () => buildProceduralFallback(type, materials));
  }

  // Normalized alias checks
  if (type.includes('bed') && GLB_MODEL_MAP['bed-king']) {
    return createGlbFurnitureModel('bed-king', () => buildMediterraneanBed(materials));
  }
  if (type.includes('drawer') && GLB_MODEL_MAP['med-drawers']) {
    return createGlbFurnitureModel('med-drawers', () => buildMediterraneanDrawers(materials));
  }
  if (type.includes('coffee') && GLB_MODEL_MAP['table-coffee']) {
    return createGlbFurnitureModel('table-coffee', () => buildMediterraneanCoffeeTable(materials));
  }
  if (type.includes('dining') && type.includes('table') && GLB_MODEL_MAP['table-dining']) {
    return createGlbFurnitureModel('table-dining', () => buildMediterraneanDiningTable(materials));
  }
  if (type.includes('lounge') && GLB_MODEL_MAP['chair-lounge']) {
    return createGlbFurnitureModel('chair-lounge', () => buildMediterraneanArmchair(materials));
  }
  if (type.includes('chair') && GLB_MODEL_MAP['chair-dining']) {
    return createGlbFurnitureModel('chair-dining', () => buildMediterraneanDiningChair(materials));
  }

  return buildProceduralFallback(type, materials);
}
