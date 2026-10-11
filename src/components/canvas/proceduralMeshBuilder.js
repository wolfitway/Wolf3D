import * as THREE from 'three';

/**
 * Creates genuine 3D polygonal furniture meshes from scratch.
 * Real geometry: separate tapered legs, brass ferrules, curved tub backrests,
 * sculpted cushions, welt cords, and PBR materials with zero flat decals.
 */

// Helper to create a rich PBR material
function createPBRMat({ color = 0xeae5dc, roughness = 0.85, metalness = 0.0, bumpScale = 0.01 }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    bumpScale
  });
}

// Preset furniture materials
export const FURNITURE_MATERIALS = {
  boucleLinen: () => createPBRMat({ color: 0xede8df, roughness: 0.92, metalness: 0.0 }),
  sageLinen: () => createPBRMat({ color: 0x8a9a86, roughness: 0.88, metalness: 0.0 }),
  terracottaVelvet: () => createPBRMat({ color: 0xb55a30, roughness: 0.82, metalness: 0.05 }),
  charcoalLeather: () => createPBRMat({ color: 0x2c2926, roughness: 0.65, metalness: 0.1 }),
  nordicOak: () => createPBRMat({ color: 0x9e7247, roughness: 0.6, metalness: 0.0 }),
  darkCedar: () => createPBRMat({ color: 0x5a3d28, roughness: 0.55, metalness: 0.0 }),
  brushedBrass: () => createPBRMat({ color: 0xd4af37, roughness: 0.28, metalness: 0.88 }),
  travertineStone: () => createPBRMat({ color: 0xd8cebf, roughness: 0.75, metalness: 0.0 })
};

/**
 * Builds a 3D Lounge Armchair from scratch
 * Features: 4 splayed tapered round legs, brass ferrules, thick curved seat cushion,
 * wraparound barrel tub backrest, and piping welt trim.
 */
export function buildProceduralArmchair({ width = 0.84, depth = 0.82, height = 0.78, fabric = 'boucleLinen', wood = 'nordicOak' } = {}) {
  const root = new THREE.Group();
  root.name = 'ProceduralArmchair';

  const matFabric = (FURNITURE_MATERIALS[fabric] || FURNITURE_MATERIALS.boucleLinen)();
  const matWood = (FURNITURE_MATERIALS[wood] || FURNITURE_MATERIALS.nordicOak)();
  const matBrass = FURNITURE_MATERIALS.brushedBrass();

  const seatY = 0.42; // standard seat height
  const seatRadius = Math.min(width, depth) * 0.44;
  const seatThickness = 0.14;

  // 1. Four Splayed Tapered Round Legs with Brass Ferrules
  const legHeight = seatY - 0.04;
  const legRadiusTop = 0.024;
  const legRadiusBottom = 0.014;
  const legGeom = new THREE.CylinderGeometry(legRadiusTop, legRadiusBottom, legHeight, 16);
  const ferruleGeom = new THREE.CylinderGeometry(legRadiusBottom + 0.002, legRadiusBottom, 0.04, 16);

  const legSpreadX = width * 0.32;
  const legSpreadZ = depth * 0.32;
  const legPositions = [
    { x: -legSpreadX, z: legSpreadZ, tiltX: 0.12, tiltZ: -0.12 },
    { x: legSpreadX, z: legSpreadZ, tiltX: 0.12, tiltZ: 0.12 },
    { x: -legSpreadX, z: -legSpreadZ, tiltX: -0.12, tiltZ: -0.12 },
    { x: legSpreadX, z: -legSpreadZ, tiltX: -0.12, tiltZ: 0.12 }
  ];

  legPositions.forEach(pos => {
    const legGroup = new THREE.Group();
    legGroup.position.set(pos.x, legHeight / 2, pos.z);
    legGroup.rotation.x = pos.tiltX;
    legGroup.rotation.z = pos.tiltZ;

    const legMesh = new THREE.Mesh(legGeom, matWood);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    legGroup.add(legMesh);

    // Brass ferrule tip
    const ferruleMesh = new THREE.Mesh(ferruleGeom, matBrass);
    ferruleMesh.position.y = -legHeight / 2 + 0.02;
    ferruleMesh.castShadow = true;
    legGroup.add(ferruleMesh);

    root.add(legGroup);
  });

  // 2. Thick Sculpted Seat Cushion (Cylindrical / rounded pill)
  const seatGeom = new THREE.CylinderGeometry(seatRadius, seatRadius * 1.02, seatThickness, 32);
  const seatMesh = new THREE.Mesh(seatGeom, matFabric);
  seatMesh.position.set(0, seatY, 0);
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  root.add(seatMesh);

  // Seat welt piping cord
  const weltGeom = new THREE.TorusGeometry(seatRadius * 1.01, 0.009, 12, 32);
  weltGeom.rotateX(Math.PI / 2);
  const weltMesh = new THREE.Mesh(weltGeom, matFabric);
  weltMesh.position.set(0, seatY + seatThickness / 2, 0);
  root.add(weltMesh);

  // 3. Curved Tub Barrel Backrest
  // Generate a smooth sweeping U-shaped backrest arc
  const backrestHeight = height - seatY;
  const backrestRadius = seatRadius * 1.06;
  const backrestThickness = 0.09;
  
  // Use Cylinder slice or Lathe
  const arcSpan = Math.PI * 1.15; // wraps around back and sides
  const backGeom = new THREE.CylinderGeometry(
    backrestRadius,
    backrestRadius,
    backrestHeight,
    32,
    1,
    true, // open-ended
    Math.PI / 2 - arcSpan / 2,
    arcSpan
  );

  // Create solid volumetric thickness by creating an inner and outer wall group
  const backGroup = new THREE.Group();
  backGroup.position.set(0, seatY + backrestHeight / 2, -depth * 0.04);

  // Outer curved wall
  const outerBack = new THREE.Mesh(
    new THREE.CylinderGeometry(backrestRadius + backrestThickness / 2, backrestRadius + backrestThickness / 2, backrestHeight, 32, 1, false, Math.PI / 2 - arcSpan / 2, arcSpan),
    matFabric
  );
  outerBack.castShadow = true;
  outerBack.receiveShadow = true;
  backGroup.add(outerBack);

  // Rounded top cap rail along the backrest
  const rimPoints = [];
  const rimSteps = 24;
  for (let i = 0; i <= rimSteps; i++) {
    const angle = (Math.PI / 2 - arcSpan / 2) + (i / rimSteps) * arcSpan;
    rimPoints.push(new THREE.Vector3(Math.cos(angle) * backrestRadius, backrestHeight / 2, Math.sin(angle) * backrestRadius));
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints);
  const rimGeom = new THREE.TubeGeometry(rimCurve, 32, backrestThickness / 2, 12, false);
  const rimMesh = new THREE.Mesh(rimGeom, matFabric);
  rimMesh.castShadow = true;
  backGroup.add(rimMesh);

  root.add(backGroup);

  // 4. Accent Lumbar Cushion
  const pillowGeom = new THREE.BoxGeometry(width * 0.42, 0.22, 0.1, 8, 8, 4);
  // soften pillow vertices
  const pos = pillowGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const factor = (1 - (x * x) / (0.42 * 0.42)) * (1 - (y * y) / (0.22 * 0.22));
    pos.setZ(i, z * (0.6 + 0.4 * factor));
  }
  pillowGeom.computeVertexNormals();

  const matAccent = (fabric === 'sageLinen' ? FURNITURE_MATERIALS.boucleLinen : FURNITURE_MATERIALS.sageLinen)();
  const pillowMesh = new THREE.Mesh(pillowGeom, matAccent);
  pillowMesh.position.set(0, seatY + 0.16, -depth * 0.16);
  pillowMesh.rotation.x = -0.15;
  pillowMesh.castShadow = true;
  root.add(pillowMesh);

  return root;
}

/**
 * Builds a 3D Dining Chair from scratch
 */
export function buildProceduralDiningChair({ width = 0.52, depth = 0.54, height = 0.84, fabric = 'boucleLinen', wood = 'nordicOak' } = {}) {
  const root = new THREE.Group();
  root.name = 'ProceduralDiningChair';

  const matFabric = (FURNITURE_MATERIALS[fabric] || FURNITURE_MATERIALS.boucleLinen)();
  const matWood = (FURNITURE_MATERIALS[wood] || FURNITURE_MATERIALS.nordicOak)();
  const matBrass = FURNITURE_MATERIALS.brushedBrass();

  const seatY = 0.46;
  const legH = seatY - 0.03;

  // 4 Splayed Legs
  const legGeom = new THREE.CylinderGeometry(0.018, 0.011, legH, 16);
  const legSpreadX = width * 0.36;
  const legSpreadZ = depth * 0.36;

  [
    [-legSpreadX, legSpreadZ],
    [legSpreadX, legSpreadZ],
    [-legSpreadX, -legSpreadZ],
    [legSpreadX, -legSpreadZ]
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeom, matWood);
    leg.position.set(lx, legH / 2, lz);
    leg.castShadow = true;
    root.add(leg);
  });

  // Contoured Seat Cushion
  const seatGeom = new THREE.BoxGeometry(width * 0.88, 0.07, depth * 0.86, 6, 2, 6);
  const seat = new THREE.Mesh(seatGeom, matFabric);
  seat.position.set(0, seatY, 0);
  seat.castShadow = true;
  root.add(seat);

  // Curved Wood/Fabric Backrest Spindle Frame
  const backH = height - seatY;
  const backGeom = new THREE.BoxGeometry(width * 0.78, backH * 0.65, 0.04, 8, 4, 2);
  const back = new THREE.Mesh(backGeom, matFabric);
  back.position.set(0, seatY + backH * 0.55, -depth * 0.38);
  back.rotation.x = -0.1;
  back.castShadow = true;
  root.add(back);

  // Rear support uprights
  const uprightGeom = new THREE.CylinderGeometry(0.014, 0.014, backH, 12);
  [-width * 0.28, width * 0.28].forEach(x => {
    const upright = new THREE.Mesh(uprightGeom, matWood);
    upright.position.set(x, seatY + backH / 2 - 0.02, -depth * 0.36);
    upright.rotation.x = -0.1;
    root.add(upright);
  });

  return root;
}

/**
 * Builds a 3D Low Round Coffee Table from scratch
 */
export function buildProceduralCoffeeTable({ width = 1.15, depth = 1.15, height = 0.38, wood = 'nordicOak' } = {}) {
  const root = new THREE.Group();
  root.name = 'ProceduralCoffeeTable';

  const matWood = (FURNITURE_MATERIALS[wood] || FURNITURE_MATERIALS.nordicOak)();
  const matStone = FURNITURE_MATERIALS.travertineStone();

  const radius = Math.min(width, depth) / 2;
  const slabH = 0.045;

  // Solid Bevelled Tabletop Slab
  const topGeom = new THREE.CylinderGeometry(radius, radius * 0.98, slabH, 48);
  const topMesh = new THREE.Mesh(topGeom, matWood);
  topMesh.position.set(0, height - slabH / 2, 0);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  root.add(topMesh);

  // 3 Sculptural Tapered Offset Legs
  const legH = height - slabH;
  const legGeom = new THREE.CylinderGeometry(0.04, 0.025, legH, 24);
  const legRadius = radius * 0.62;

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(legGeom, matWood);
    leg.position.set(Math.cos(angle) * legRadius, legH / 2, Math.sin(angle) * legRadius);
    leg.castShadow = true;
    root.add(leg);
  }

  return root;
}

/**
 * Builds a 3D Modular Sectional Sofa from scratch
 */
export function buildProceduralSectionalSofa({ width = 2.8, depth = 1.85, height = 0.82, fabric = 'boucleLinen', wood = 'nordicOak' } = {}) {
  const root = new THREE.Group();
  root.name = 'ProceduralSectionalSofa';

  const matFabric = (FURNITURE_MATERIALS[fabric] || FURNITURE_MATERIALS.boucleLinen)();
  const matWood = (FURNITURE_MATERIALS[wood] || FURNITURE_MATERIALS.nordicOak)();

  const plinthH = 0.08;
  const seatH = 0.42;

  // 1. Low Wooden Plinth Base
  const baseMain = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, plinthH, depth * 0.52), matWood);
  baseMain.position.set(-width * 0.16, plinthH / 2, 0);
  baseMain.castShadow = true;
  root.add(baseMain);

  const baseChaise = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, plinthH, depth), matWood);
  baseChaise.position.set(width * 0.32, plinthH / 2, 0);
  baseChaise.castShadow = true;
  root.add(baseChaise);

  // 2. Volumetric Deep Cushion Blocks
  const cushionH = seatH - plinthH;
  // Main seat cushions (2 wide cushions)
  const seatWidth1 = width * 0.32;
  [-width * 0.32, 0].forEach(x => {
    const cMesh = new THREE.Mesh(new THREE.BoxGeometry(seatWidth1 * 0.96, cushionH, depth * 0.48 * 0.96), matFabric);
    cMesh.position.set(x, plinthH + cushionH / 2, 0);
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    root.add(cMesh);
  });

  // Chaise long cushion
  const chaiseMesh = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, cushionH, depth * 0.96), matFabric);
  chaiseMesh.position.set(width * 0.32, plinthH + cushionH / 2, 0);
  chaiseMesh.castShadow = true;
  root.add(chaiseMesh);

  // 3. Backrest Wall
  const backH = height - seatH;
  const backThick = 0.22;
  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, backH, backThick), matFabric);
  backMesh.position.set(0, seatH + backH / 2, -depth * 0.24 - backThick / 2);
  backMesh.castShadow = true;
  root.add(backMesh);

  // 4. Accent Throw Pillows
  const pillowMat = FURNITURE_MATERIALS.sageLinen();
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.14), pillowMat);
  pillow1.position.set(-width * 0.35, seatH + 0.22, -depth * 0.18);
  pillow1.rotation.y = 0.2;
  pillow1.castShadow = true;
  root.add(pillow1);

  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), FURNITURE_MATERIALS.terracottaVelvet());
  pillow2.position.set(width * 0.24, seatH + 0.2, -depth * 0.2);
  pillow2.rotation.y = -0.3;
  pillow2.castShadow = true;
  root.add(pillow2);

  return root;
}

/**
 * Builds a 3D Artisan 3-Drawer Credenza from scratch
 */
export function buildProceduralCredenza({ width = 1.3, depth = 0.5, height = 0.84, wood = 'darkCedar' } = {}) {
  const root = new THREE.Group();
  root.name = 'ProceduralCredenza';

  const matWood = (FURNITURE_MATERIALS[wood] || FURNITURE_MATERIALS.darkCedar)();
  const matBrass = FURNITURE_MATERIALS.brushedBrass();

  const legH = 0.22;
  const bodyH = height - legH;

  // 4 Splayed Turned Legs
  const legGeom = new THREE.CylinderGeometry(0.022, 0.014, legH, 16);
  const ferruleGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 16);
  const legSpreadX = width * 0.42;
  const legSpreadZ = depth * 0.38;

  [
    [-legSpreadX, legSpreadZ],
    [legSpreadX, legSpreadZ],
    [-legSpreadX, -legSpreadZ],
    [legSpreadX, -legSpreadZ]
  ].forEach(([lx, lz]) => {
    const legGrp = new THREE.Group();
    legGrp.position.set(lx, legH / 2, lz);
    const leg = new THREE.Mesh(legGeom, matWood);
    leg.castShadow = true;
    legGrp.add(leg);
    const ferrule = new THREE.Mesh(ferruleGeom, matBrass);
    ferrule.position.y = -legH / 2 + 0.02;
    legGrp.add(ferrule);
    root.add(legGrp);
  });

  // Main Carcass Body
  const carcassGeom = new THREE.BoxGeometry(width, bodyH, depth);
  const carcass = new THREE.Mesh(carcassGeom, matWood);
  carcass.position.set(0, legH + bodyH / 2, 0);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  root.add(carcass);

  // 3 Drawers with brass handles
  const drawerH = (bodyH * 0.9) / 3;
  for (let i = 0; i < 3; i++) {
    const dy = legH + 0.04 + i * drawerH + drawerH / 2;
    // Drawer front relief panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.94, drawerH * 0.88, 0.02), matWood);
    panel.position.set(0, dy, depth / 2 + 0.01);
    root.add(panel);

    // Brass horizontal pull handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, width * 0.22, 12), matBrass);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, dy, depth / 2 + 0.03);
    root.add(handle);
  }

  return root;
}

/**
 * Universal dispatcher: creates genuine 3D model from scratch
 */
export function buildProceduralFurnitureFromScratch({
  category = 'armchair',
  dimensions = { width: 0.84, depth: 0.82, height: 0.78 },
  fabric = 'boucleLinen',
  wood = 'nordicOak'
} = {}) {
  const { width = 1.0, depth = 1.0, height = 0.8 } = dimensions;

  switch (category) {
    case 'armchair':
    case 'chair':
      return buildProceduralArmchair({ width, depth, height, fabric, wood });
    case 'dining_chair':
      return buildProceduralDiningChair({ width, depth, height, fabric, wood });
    case 'table':
    case 'coffee_table':
      return buildProceduralCoffeeTable({ width, depth, height, wood });
    case 'sofa':
    case 'sectional_sofa':
      return buildProceduralSectionalSofa({ width, depth, height, fabric, wood });
    case 'credenza':
    case 'drawers':
      return buildProceduralCredenza({ width, depth, height, wood });
    default:
      return buildProceduralArmchair({ width, depth, height, fabric, wood });
  }
}
