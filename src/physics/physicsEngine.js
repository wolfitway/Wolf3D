import RAPIER from '@dimforge/rapier3d-compat';

class PhysicsEngine {
  constructor() {
    this.world = null;
    this.isReady = false;
    this.floorCollider = null;
    this.wallColliders = [];
    this.physicsObjects = new Map(); // id -> { body, collider, type }
    this.customDimensions = new Map(); // type -> { width, height, depth }
  }

  registerDimensions(type, width, height, depth) {
    this.customDimensions.set(type, { width, height, depth });
  }

  async init(roomWidth = 11.0, roomDepth = 7.8, wallHeight = 3.4) {
    if (this.isReady) return;
    await RAPIER.init();
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new RAPIER.World(gravity);
    this.isReady = true;
    this.updateBoundaries(roomWidth, roomDepth, wallHeight);
    console.log('Rapier3D WASM Physics engine initialized with solid floor collider.');
  }

  getDimensions(type) {
    if (this.customDimensions && this.customDimensions.has(type)) {
      return this.customDimensions.get(type);
    }
    if (type === 'crate-wood') return { width: 0.55, height: 0.55, depth: 0.55 };
    if (type === 'crate-industrial') return { width: 0.50, height: 0.50, depth: 0.50 };
    if (type === 'med-drawers' || type === 'drawers') return { width: 1.30, height: 0.84, depth: 0.50 };
    if (type === 'table-dining' || type === 'med-dining-table') return { width: 1.90, height: 0.76, depth: 0.95 };
    if (type === 'table-coffee' || type === 'med-coffee-table') return { width: 1.18, height: 0.38, depth: 0.68 };
    if (type === 'chair-lounge' || type === 'med-chair-lounge') return { width: 0.82, height: 0.78, depth: 0.82 };
    if (type === 'chair-dining' || type === 'med-chair-dining') return { width: 0.52, height: 0.88, depth: 0.52 };
    if (type === 'nightstand-drawer' || type === 'med-nightstand') return { width: 0.56, height: 0.62, depth: 0.44 };
    if (type === 'pouf-velvet' || type === 'med-pouf') return { width: 0.62, height: 0.36, depth: 0.62 };
    if (type === 'prop-vase' || type === 'med-amphora') return { width: 0.44, height: 0.58, depth: 0.44 };
    if (type === 'prop-plant' || type === 'med-olive-tree') return { width: 0.60, height: 1.75, depth: 0.60 };
    if (type === 'prop-cat') return { width: 0.32, height: 0.28, depth: 0.45 };
    if (type === 'bed-king' || type === 'med-bed' || type === 'bed') return { width: 2.15, height: 1.15, depth: 2.25 };
    if (type === 'curtain-drape' || type === 'med-curtains' || type === 'curtains') return { width: 3.60, height: 2.90, depth: 0.18 };
    return { width: 0.60, height: 0.60, depth: 0.60 };
  }

  getHalfHeight(type) {
    const dim = this.getDimensions(type);
    return dim.height / 2;
  }

  getSupportingSurfaceY(px, pz, excludeId, itemType) {
    // Only certain smaller decor/items can rest on furniture surfaces
    const isStackable = [
      'prop-vase', 'med-amphora',
      'prop-cat',
      'crate-wood', 'crate-industrial',
      'prop-plant', 'med-olive-tree',
      'pouf-velvet', 'med-pouf'
    ].includes(itemType);

    if (!isStackable) return 0.0;

    let highestSurface = 0.0;
    for (const [id, record] of this.physicsObjects.entries()) {
      if (id === excludeId || !record.body) continue;
      const type = record.type;
      // Surfaces that can hold items: dining table, coffee table, credenza, nightstand, platform bed
      const surfaceTypes = {
        'table-dining': 0.76,
        'med-dining-table': 0.76,
        'table-coffee': 0.38,
        'med-coffee-table': 0.38,
        'med-drawers': 0.84,
        'drawers': 0.84,
        'nightstand-drawer': 0.62,
        'med-nightstand': 0.62,
        'bed-king': 0.52,
        'med-bed': 0.52,
        'bed': 0.52
      };

      const topY = surfaceTypes[type];
      if (topY) {
        const t = record.body.translation();
        const dim = this.getDimensions(type);
        const halfW = dim.width / 2;
        const halfD = dim.depth / 2;
        // Check if px, pz lies within horizontal bounds of this furniture
        if (Math.abs(px - t.x) <= halfW && Math.abs(pz - t.z) <= halfD) {
          if (topY > highestSurface) {
            highestSurface = topY;
          }
        }
      }
    }
    return highestSurface;
  }

  updateBoundaries(roomWidth = 11.0, roomDepth = 7.8, wallHeight = 3.4, partitionColliders = []) {
    if (!this.world) return;

    if (this.floorCollider) {
      this.world.removeCollider(this.floorCollider, true);
      this.floorCollider = null;
    }
    this.wallColliders.forEach(c => this.world.removeCollider(c, true));
    this.wallColliders = [];

    // Solid rock-solid 2m thick ground plane from y = -2.0 to y = 0.0 (exact floor surface)
    const floorHalfThick = 1.0;
    const floorDesc = RAPIER.ColliderDesc.cuboid(roomWidth / 2 + 10, floorHalfThick, roomDepth / 2 + 10)
      .setTranslation(0, -floorHalfThick, 0)
      .setFriction(0.85)
      .setRestitution(0.05);
    this.floorCollider = this.world.createCollider(floorDesc);

    // Perimeter walls (thick 0.6m colliders so items never punch through)
    const backWallDesc = RAPIER.ColliderDesc.cuboid(roomWidth / 2, wallHeight / 2, 0.3)
      .setTranslation(0, wallHeight / 2, -roomDepth / 2 - 0.3);
    this.wallColliders.push(this.world.createCollider(backWallDesc));

    const leftWallDesc = RAPIER.ColliderDesc.cuboid(0.3, wallHeight / 2, roomDepth / 2)
      .setTranslation(-roomWidth / 2 - 0.3, wallHeight / 2, 0);
    this.wallColliders.push(this.world.createCollider(leftWallDesc));

    const rightWallDesc = RAPIER.ColliderDesc.cuboid(0.3, wallHeight / 2, roomDepth / 2)
      .setTranslation(roomWidth / 2 + 0.3, wallHeight / 2, 0);
    this.wallColliders.push(this.world.createCollider(rightWallDesc));

    // Partitions
    for (const p of partitionColliders) {
      const desc = RAPIER.ColliderDesc.cuboid(p.hx, p.hy, p.hz)
        .setTranslation(p.x, p.y, p.z)
        .setFriction(0.6);
      this.wallColliders.push(this.world.createCollider(desc));
    }
  }

  createBody(id, type, px, py, pz) {
    if (!this.world) return null;

    const halfH = this.getHalfHeight(type);
    const safeY = Math.max(py !== undefined ? py : halfH, halfH);
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(px, safeY, pz);

    let colliderDesc;
    if (type === 'crate-wood') {
      const size = 0.55;
      colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2).setDensity(1.8).setRestitution(0.15);
    } else if (type === 'crate-industrial') {
      const size = 0.5;
      colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2).setDensity(3.5).setRestitution(0.1);
    } else if (type === 'med-drawers' || type === 'drawers') {
      const w = 1.30, h = 0.84, d = 0.50;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(2.4).setRestitution(0.05);
    } else if (type === 'table-dining' || type === 'med-dining-table') {
      const w = 1.90, h = 0.76, d = 0.95;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(2.2).setRestitution(0.05);
    } else if (type === 'table-coffee' || type === 'med-coffee-table') {
      const w = 1.18, h = 0.38, d = 0.68;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(2.0).setRestitution(0.05);
    } else if (type === 'chair-lounge' || type === 'med-chair-lounge') {
      const w = 0.82, h = 0.78, d = 0.82;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(1.4).setRestitution(0.05);
    } else if (type === 'chair-dining' || type === 'med-chair-dining') {
      const w = 0.52, h = 0.88, d = 0.52;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(1.3).setRestitution(0.05);
    } else if (type === 'nightstand-drawer' || type === 'med-nightstand') {
      const w = 0.56, h = 0.62, d = 0.44;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(1.5).setRestitution(0.05);
    } else if (type === 'pouf-velvet' || type === 'med-pouf') {
      const s = 0.62;
      colliderDesc = RAPIER.ColliderDesc.cuboid(s / 2, 0.18, s / 2).setDensity(0.9);
    } else if (type === 'prop-vase' || type === 'med-amphora') {
      const r = 0.22, h = 0.58;
      colliderDesc = RAPIER.ColliderDesc.cylinder(h / 2, r).setDensity(1.2);
    } else if (type === 'prop-plant' || type === 'med-olive-tree') {
      const r = 0.28, h = 1.75;
      colliderDesc = RAPIER.ColliderDesc.cylinder(h / 2, r).setDensity(1.1);
    } else if (type === 'prop-cat') {
      const w = 0.32, h = 0.28, d = 0.45;
      colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setDensity(0.9).setRestitution(0.3);
    } else {
      colliderDesc = RAPIER.ColliderDesc.cuboid(0.3, 0.3, 0.3).setDensity(1.0);
    }

    const rigidBody = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(colliderDesc, rigidBody);

    // Keep furniture standing upright on the floor (lock pitch and roll, allow yaw rotation)
    if (rigidBody.setEnabledRotations) {
      rigidBody.setEnabledRotations(false, true, false, true);
    }

    const record = { body: rigidBody, collider, type };
    this.physicsObjects.set(id, record);
    return record;
  }

  settleBody(id, targetY) {
    const record = this.physicsObjects.get(id);
    if (!record || !record.body) return;
    const t = record.body.translation();
    const halfH = this.getHalfHeight(record.type);
    const finalY = targetY !== undefined ? targetY : halfH;
    record.body.setTranslation({ x: t.x, y: finalY, z: t.z }, true);
    record.body.setLinvel({ x: 0, y: -0.2, z: 0 }, true);
    record.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    record.body.wakeUp();
  }

  teleportBody(id, x, y, z) {
    const record = this.physicsObjects.get(id);
    if (!record || !record.body) return;
    record.body.setTranslation({ x, y, z }, true);
    record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    record.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    record.body.wakeUp();
  }

  removeBody(id) {
    if (!this.world) return;
    const record = this.physicsObjects.get(id);
    if (record) {
      this.world.removeRigidBody(record.body);
      this.physicsObjects.delete(id);
    }
  }

  clear() {
    if (!this.world) return;
    for (const record of this.physicsObjects.values()) {
      this.world.removeRigidBody(record.body);
    }
    this.physicsObjects.clear();
  }

  step() {
    if (this.world) {
      this.world.step();

      // Floor safety clamp: ensure every item stays on top of the solid floor
      for (const record of this.physicsObjects.values()) {
        if (record.body) {
          const t = record.body.translation();
          const halfH = this.getHalfHeight(record.type);
          if (t.y < halfH) {
            record.body.setTranslation({ x: t.x, y: halfH, z: t.z }, true);
            record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          }
        }
      }
    }
  }
}

export const physicsEngine = new PhysicsEngine();
