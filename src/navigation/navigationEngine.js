/**
 * Wolf3D Spatial Architecture Navigation Engine
 * 
 * Provides:
 * 1. Room topology & geometric bounding zones.
 * 2. Portal & Doorway detection (recognizes door openings vs solid walls/windows).
 * 3. Obstacle avoidance (walls, glass facades, furniture colliders).
 * 4. A* Room-Portal Graph Pathfinding with corridor approach waypoints.
 * 5. Raycasting / Line-of-sight & string-pulling path smoothing.
 * 6. Dynamic collision sliding (ensuring agents & first-person walk use doors and cannot pass through walls).
 */

import * as THREE from 'three';

export class NavigationEngine {
  constructor() {
    this.currentPlan = 'villa';
    this.dimensions = { width: 11.0, depth: 7.8, height: 3.4 };
    this.doorsOpen = {
      villaDoor1: true,
      villaDoor2: true,
      slidingPocket: true,
      terraceSlide: true
    };
  }

  setPlan(plan, dimensions) {
    this.currentPlan = plan || 'villa';
    if (dimensions) {
      this.dimensions = { ...dimensions };
    }
  }

  /**
   * Get architectural layout zones, doorways, and solid wall obstacles for the active plan
   */
  getLayoutData() {
    const { width: w, depth: d } = this.dimensions;
    const halfW = w / 2;
    const halfD = d / 2;

    if (this.currentPlan === 'villa') {
      // ---------------------------------------------------------
      // VILLA LUMINA (3 Distinct Rooms + Terrace + 2 Walkable Doors)
      // ---------------------------------------------------------
      const rooms = {
        salon: {
          id: 'salon',
          name: 'Living Salon & Lounge',
          icon: '🛋️',
          bounds: { minX: -halfW + 0.6, maxX: -0.3, minZ: -halfD + 0.6, maxZ: halfD - 0.6 },
          center: { x: -2.7, z: 0 },
          color: 0x8a9ba8
        },
        kitchen: {
          id: 'kitchen',
          name: "Chef's Kitchen & Dining",
          icon: '🍳',
          bounds: { minX: 0.3, maxX: halfW - 0.6, minZ: -halfD + 0.6, maxZ: -0.2 },
          center: { x: 2.6, z: -1.9 },
          color: 0xd9823b
        },
        suite: {
          id: 'suite',
          name: 'Master Bedroom Suite',
          icon: '🛏️',
          bounds: { minX: 0.3, maxX: halfW - 0.6, minZ: 0.2, maxZ: halfD - 0.6 },
          center: { x: 2.6, z: 1.8 },
          color: 0x5a8b6f
        },
        terrace: {
          id: 'terrace',
          name: 'Cantilevered Sunset Terrace',
          icon: '🌅',
          bounds: { minX: -halfW + 0.5, maxX: halfW - 0.5, minZ: halfD + 0.5, maxZ: halfD + 4.2 },
          center: { x: 0.6, z: halfD + 2.2 },
          color: 0x3d78c2
        }
      };

      // Doorway portals through walls
      const portals = [
        {
          id: 'door_salon_kitchen',
          name: 'Doorway 1 (Kitchen Portal)',
          roomA: 'salon',
          roomB: 'kitchen',
          pos: { x: 0, z: -0.75 },
          width: 1.1,
          axis: 'x', // wall is along z, opening is crossed along x
          approachA: { x: -0.75, z: -0.75 }, // salon side
          approachB: { x: 0.75, z: -0.75 },  // kitchen side
          isOpen: true
        },
        {
          id: 'door_salon_suite',
          name: 'Doorway 2 (Master Suite Portal)',
          roomA: 'salon',
          roomB: 'suite',
          pos: { x: 0, z: 2.55 },
          width: 1.1,
          axis: 'x',
          approachA: { x: -0.75, z: 2.55 },  // salon side
          approachB: { x: 0.75, z: 2.55 },   // suite side
          isOpen: true
        },
        {
          id: 'door_salon_terrace',
          name: 'Sliding Glass Terrace Portal',
          roomA: 'salon',
          roomB: 'terrace',
          pos: { x: -1.8, z: halfD },
          width: 2.2,
          axis: 'z',
          approachA: { x: -1.8, z: halfD - 0.75 },
          approachB: { x: -1.8, z: halfD + 0.75 },
          isOpen: true
        },
        {
          id: 'door_suite_terrace',
          name: 'Suite Terrace Sliding French Doors',
          roomA: 'suite',
          roomB: 'terrace',
          pos: { x: 2.2, z: halfD },
          width: 1.8,
          axis: 'z',
          approachA: { x: 2.2, z: halfD - 0.75 },
          approachB: { x: 2.2, z: halfD + 0.75 },
          isOpen: true
        }
      ];

      // Solid partitions & walls that MUST NEVER be walked through
      const obstacles = [
        // Partition A (between Salon and Kitchen, above Door 1)
        { x: 0, z: -2.6, hx: 0.15, hz: 1.3, type: 'wall', label: 'Partition A' },
        // Partition B (between Door 1 and Door 2)
        { x: 0, z: 0.9, hx: 0.15, hz: 1.1, type: 'wall', label: 'Partition B' },
        // Partition C (below Door 2 to front facade)
        { x: 0, z: 3.5, hx: 0.15, hz: 0.4, type: 'wall', label: 'Partition C' },
        // Cross Partition (dividing Kitchen & Suite - NO direct door, must use hallway!)
        { x: 2.1, z: 0, hx: 2.1, hz: 0.15, type: 'wall', label: 'Kitchen/Suite Dividing Wall' },
        
        // Perimeter Obstacles (Back Wall, Left Wall, Right Wall)
        { x: 0, z: -halfD - 0.1, hx: halfW + 0.5, hz: 0.2, type: 'wall', label: 'North Perimeter Wall' },
        { x: -halfW - 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'West Perimeter Wall (Window Glass)' },
        { x: halfW + 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'East Perimeter Wall' },

        // Front glass facade sections that are NOT the terrace sliding doors
        { x: 0.3, z: halfD, hx: 0.8, hz: 0.1, type: 'window', label: 'Central Panoramic Glass Pane' },
        { x: -halfW + 0.5, z: halfD, hx: 0.6, hz: 0.1, type: 'window', label: 'Corner Picture Window Pane' },

        // Fixed Architectural Furniture (Solid Impassable Obstacles)
        { x: 2.8, z: -2.4, hx: 1.35, hz: 0.58, type: 'furniture', label: 'Marble Kitchen Island' },
        { x: 2.8, z: -1.65, hx: 0.95, hz: 0.25, type: 'furniture', label: 'Kitchen Island Stools' },
        { x: 2.6, z: 2.2, hx: 1.15, hz: 1.15, type: 'furniture', label: 'Platform King Bed' },
        { x: 1.44, z: 2.2, hx: 0.08, hz: 1.35, type: 'wall', label: 'Headboard Slat Wall' },
        { x: -2.8, z: 1.2, hx: 1.5, hz: 0.95, type: 'furniture', label: 'Living Salon Sofa' }
      ];

      return { rooms, portals, obstacles };
    } else if (this.currentPlan === 'studio') {
      // ---------------------------------------------------------
      // MICRO STUDIO (Living/Joinery, Kitchenette, Terrace)
      // ---------------------------------------------------------
      const rooms = {
        living: {
          id: 'living',
          name: 'Adaptive Joinery Salon',
          icon: '🛋️',
          bounds: { minX: -halfW + 0.5, maxX: 0.5, minZ: -halfD + 0.5, maxZ: halfD - 0.5 },
          center: { x: -1.2, z: 0.3 },
          color: 0x8a9ba8
        },
        kitchenette: {
          id: 'kitchenette',
          name: 'Sliding Pocket Kitchenette',
          icon: '🍳',
          bounds: { minX: 0.2, maxX: halfW - 0.5, minZ: -halfD + 0.5, maxZ: 0.2 },
          center: { x: 1.6, z: -1.2 },
          color: 0xd9823b
        },
        terrace: {
          id: 'terrace',
          name: 'Sunset Balcony',
          icon: '🌅',
          bounds: { minX: -halfW + 0.5, maxX: halfW - 0.5, minZ: halfD + 0.5, maxZ: halfD + 3.5 },
          center: { x: 0, z: halfD + 1.8 },
          color: 0x3d78c2
        }
      };

      const portals = [
        {
          id: 'door_living_kitchenette',
          name: 'Pocket Kitchen Door Portal',
          roomA: 'living',
          roomB: 'kitchenette',
          pos: { x: 0.2, z: -0.5 },
          width: 1.4,
          axis: 'x',
          approachA: { x: -0.6, z: -0.5 },
          approachB: { x: 1.0, z: -0.5 },
          isOpen: true
        },
        {
          id: 'door_living_terrace',
          name: 'Studio Balcony Portal',
          roomA: 'living',
          roomB: 'terrace',
          pos: { x: 0, z: halfD },
          width: 2.0,
          axis: 'z',
          approachA: { x: 0, z: halfD - 0.7 },
          approachB: { x: 0, z: halfD + 0.7 },
          isOpen: true
        }
      ];

      const obstacles = [
        { x: 0, z: -halfD - 0.1, hx: halfW + 0.5, hz: 0.2, type: 'wall', label: 'North Perimeter Wall' },
        { x: -halfW - 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'West Wall & Window' },
        { x: halfW + 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'East Wall' },
        // Joinery unit obstacle & studio counters
        { x: 2.3, z: -0.5, hx: 0.75, hz: 1.25, type: 'furniture', label: 'Joinery Millwork Block' },
        { x: 1.6, z: -1.2, hx: 0.85, hz: 0.55, type: 'furniture', label: 'Kitchenette Counter' },
        { x: -2.2, z: 0.0, hx: 0.95, hz: 1.1, type: 'furniture', label: 'Modular Sofa / Bed' }
      ];

      return { rooms, portals, obstacles };
    } else {
      // ---------------------------------------------------------
      // INDUSTRIAL LOFT (Creative Atelier, Platform Lounge, Column)
      // ---------------------------------------------------------
      const rooms = {
        atelier: {
          id: 'atelier',
          name: 'Creative Studio Atelier',
          icon: '🎨',
          bounds: { minX: -halfW + 0.6, maxX: -0.4, minZ: -halfD + 0.6, maxZ: halfD - 0.6 },
          center: { x: -2.4, z: 0 },
          color: 0x8a9ba8
        },
        lounge: {
          id: 'lounge',
          name: 'Platform Tatami Lounge',
          icon: '🛋️',
          bounds: { minX: 0.4, maxX: halfW - 0.6, minZ: -halfD + 0.6, maxZ: halfD - 0.6 },
          center: { x: 2.4, z: 0 },
          color: 0x5a8b6f
        },
        terrace: {
          id: 'terrace',
          name: 'Loft Sky Deck',
          icon: '🌅',
          bounds: { minX: -halfW + 0.5, maxX: halfW - 0.5, minZ: halfD + 0.5, maxZ: halfD + 3.8 },
          center: { x: 0, z: halfD + 2.0 },
          color: 0x3d78c2
        }
      };

      const portals = [
        {
          id: 'door_atelier_lounge_north',
          name: 'North Column Arch Passage',
          roomA: 'atelier',
          roomB: 'lounge',
          pos: { x: 0, z: -2.0 },
          width: 1.8,
          axis: 'x',
          approachA: { x: -0.9, z: -2.0 },
          approachB: { x: 0.9, z: -2.0 },
          isOpen: true
        },
        {
          id: 'door_atelier_lounge_south',
          name: 'South Column Arch Passage',
          roomA: 'atelier',
          roomB: 'lounge',
          pos: { x: 0, z: 2.0 },
          width: 1.8,
          axis: 'x',
          approachA: { x: -0.9, z: 2.0 },
          approachB: { x: 0.9, z: 2.0 },
          isOpen: true
        },
        {
          id: 'door_loft_terrace',
          name: 'Loft Terrace French Portals',
          roomA: 'atelier',
          roomB: 'terrace',
          pos: { x: -1.2, z: halfD },
          width: 2.4,
          axis: 'z',
          approachA: { x: -1.2, z: halfD - 0.75 },
          approachB: { x: -1.2, z: halfD + 0.75 },
          isOpen: true
        }
      ];

      const obstacles = [
        // Central Brutalist Column (Solid Obstacle)
        { x: 0, z: 0, hx: 0.38, hz: 0.38, type: 'column', label: 'Central Brutalist Column' },
        // Perimeter
        { x: 0, z: -halfD - 0.1, hx: halfW + 0.5, hz: 0.2, type: 'wall', label: 'North Perimeter Wall' },
        { x: -halfW - 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'West Perimeter Wall' },
        { x: halfW + 0.1, z: 0, hx: 0.2, hz: halfD + 0.5, type: 'wall', label: 'East Perimeter Wall' },
        // Fixed Architectural Furniture (Impassable Obstacles)
        { x: 2.2, z: -1.2, hx: 1.25, hz: 0.65, type: 'furniture', label: 'Charcoal Quartz Bar' },
        { x: 3.0, z: 1.8, hx: 1.15, hz: 1.15, type: 'furniture', label: 'Platform Tatami Bed' },
        { x: -2.2, z: 0.8, hx: 1.15, hz: 0.65, type: 'furniture', label: 'Atelier Drafting Workstation' }
      ];

      return { rooms, portals, obstacles };
    }
  }

  /**
   * Set dynamic obstacles (e.g. catalog spawned furniture, custom props)
   */
  setDynamicObstacles(obstacles) {
    this.dynamicObstacles = obstacles || [];
  }

  /**
   * Get all obstacles: layout obstacles + dynamic registered obstacles + temporary extra colliders
   */
  getAllObstacles(extra = []) {
    const { obstacles } = this.getLayoutData();
    return [...obstacles, ...(this.dynamicObstacles || []), ...extra];
  }

  /**
   * Determine which room a given (x, z) coordinate is in
   */
  getRoomAt(x, z) {
    const { rooms } = this.getLayoutData();
    for (const key in rooms) {
      const b = rooms[key].bounds;
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
        return rooms[key];
      }
    }
    // Fallback: closest room centroid
    let closest = null;
    let minD = Infinity;
    for (const key in rooms) {
      const c = rooms[key].center;
      const d = (x - c.x) ** 2 + (z - c.z) ** 2;
      if (d < minD) {
        minD = d;
        closest = rooms[key];
      }
    }
    return closest || Object.values(rooms)[0];
  }

  /**
   * Check whether a line segment between (x1, z1) and (x2, z2) hits any solid wall/obstacle
   */
  isLineBlockedByObstacles(x1, z1, x2, z2, radius = 0.32, extraColliders = []) {
    const obstacles = this.getAllObstacles(extraColliders);
    const segDir = new THREE.Vector2(x2 - x1, z2 - z1);
    const segLen = segDir.length();
    if (segLen < 0.001) return false;
    segDir.normalize();

    // Check intersection with each obstacle box expanded by radius
    for (const obs of obstacles) {
      const minX = obs.x - obs.hx - radius;
      const maxX = obs.x + obs.hx + radius;
      const minZ = obs.z - obs.hz - radius;
      const maxZ = obs.z + obs.hz + radius;

      // Slab ray-box intersection test
      let tmin = 0;
      let tmax = segLen;

      // X-slab
      if (Math.abs(segDir.x) < 1e-6) {
        if (x1 < minX || x1 > maxX) continue;
      } else {
        const invDx = 1.0 / segDir.x;
        let t1 = (minX - x1) * invDx;
        let t2 = (maxX - x1) * invDx;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) continue;
      }

      // Z-slab
      if (Math.abs(segDir.y) < 1e-6) {
        if (z1 < minZ || z1 > maxZ) continue;
      } else {
        const invDz = 1.0 / segDir.y;
        let t1 = (minZ - z1) * invDz;
        let t2 = (maxZ - z1) * invDz;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) continue;
      }

      // Overlap detected: blocked!
      return true;
    }

    return false;
  }

  /**
   * Find an intelligent, human-like path from start (x, z) to target (x, z)
   * that strictly navigates through doorways and never passes through walls.
   */
  findPath(startPos, targetPos) {
    const { rooms, portals } = this.getLayoutData();
    const startRoom = this.getRoomAt(startPos.x, startPos.z);
    const targetRoom = this.getRoomAt(targetPos.x, targetPos.z);

    // If already in same room and direct path is unblocked by furniture/columns:
    if (startRoom.id === targetRoom.id) {
      if (!this.isLineBlockedByObstacles(startPos.x, startPos.z, targetPos.x, targetPos.z)) {
        return [
          { x: startPos.x, z: startPos.z, room: startRoom.id, note: 'Start' },
          { x: targetPos.x, z: targetPos.z, room: targetRoom.id, note: 'Arrival' }
        ];
      }
    }

    // Graph BFS to find optimal sequence of rooms and portals
    // Build adjacency graph
    const adj = {};
    for (const rId in rooms) {
      adj[rId] = [];
    }

    for (const portal of portals) {
      adj[portal.roomA].push({ portal, nextRoom: portal.roomB });
      adj[portal.roomB].push({ portal, nextRoom: portal.roomA });
    }

    // Queue for BFS: [currentRoomId, pathOfPortals]
    const queue = [[startRoom.id, []]];
    const visited = new Set([startRoom.id]);
    let portalSequence = null;

    while (queue.length > 0) {
      const [currId, history] = queue.shift();
      if (currId === targetRoom.id) {
        portalSequence = history;
        break;
      }

      for (const edge of adj[currId] || []) {
        if (!visited.has(edge.nextRoom)) {
          visited.add(edge.nextRoom);
          queue.push([edge.nextRoom, [...history, { portal: edge.portal, fromRoom: currId, toRoom: edge.nextRoom }]]);
        }
      }
    }

    // If no path found (unlikely in designed house), return direct
    if (!portalSequence) {
      return [
        { x: startPos.x, z: startPos.z, room: startRoom.id, note: 'Start' },
        { x: targetPos.x, z: targetPos.z, room: targetRoom.id, note: 'Arrival' }
      ];
    }

    // Build the high-fidelity waypoint path through each door
    const waypoints = [{ x: startPos.x, z: startPos.z, room: startRoom.id, note: 'Start' }];

    for (let i = 0; i < portalSequence.length; i++) {
      const step = portalSequence[i];
      const p = step.portal;
      const isA = step.fromRoom === p.roomA;

      const enterApproach = isA ? p.approachA : p.approachB;
      const doorCenter = p.pos;
      const exitApproach = isA ? p.approachB : p.approachA;

      // Add approach point before the door so avatar lines up straight
      waypoints.push({
        x: enterApproach.x,
        z: enterApproach.y || enterApproach.z,
        room: step.fromRoom,
        portalId: p.id,
        note: `Approach ${p.name}`
      });

      // Add center doorway point (the moment of crossing the threshold)
      waypoints.push({
        x: doorCenter.x,
        z: doorCenter.z,
        room: 'doorway',
        portalId: p.id,
        isThreshold: true,
        note: `Step Through ${p.name}`
      });

      // Add exit point into the new room
      waypoints.push({
        x: exitApproach.x,
        z: exitApproach.y || exitApproach.z,
        room: step.toRoom,
        portalId: p.id,
        note: `Enter ${rooms[step.toRoom]?.name || 'Room'}`
      });
    }

    waypoints.push({ x: targetPos.x, z: targetPos.z, room: targetRoom.id, note: 'Arrival' });

    // Path smoothing / String pulling
    return this.smoothPath(waypoints);
  }

  /**
   * Smooth path waypoints while ensuring door threshold waypoints are strictly honored
   */
  smoothPath(waypoints) {
    if (waypoints.length <= 2) return waypoints;

    const smoothed = [waypoints[0]];
    let currentIdx = 0;

    while (currentIdx < waypoints.length - 1) {
      let farthestIdx = currentIdx + 1;

      // Check if we can skip intermediate non-threshold waypoints directly to a further waypoint
      for (let testIdx = currentIdx + 2; testIdx < waypoints.length; testIdx++) {
        // We must never skip a door threshold crossing!
        let hasThreshold = false;
        for (let k = currentIdx + 1; k < testIdx; k++) {
          if (waypoints[k].isThreshold) {
            hasThreshold = true;
            break;
          }
        }
        if (hasThreshold) break;

        const w1 = waypoints[currentIdx];
        const w2 = waypoints[testIdx];
        if (!this.isLineBlockedByObstacles(w1.x, w1.z, w2.x, w2.z, 0.35)) {
          farthestIdx = testIdx;
        } else {
          break;
        }
      }

      smoothed.push(waypoints[farthestIdx]);
      currentIdx = farthestIdx;
    }

    return smoothed;
  }

  /**
   * Collision resolution for First-Person Walk camera and avatars:
   * Prevents passing through walls, furniture, and occupants while smoothly sliding along them,
   * but explicitly permits passage through doorway openings!
   */
  resolveWallCollision(currPos, nextPos, radius = 0.35, extraColliders = []) {
    const { portals } = this.getLayoutData();
    const obstacles = this.getAllObstacles(extraColliders);

    // Check if nextPos is inside any door portal opening
    for (const p of portals) {
      const pz = p.pos.z;
      const px = p.pos.x;
      const halfW = p.width / 2 + 0.1;

      if (p.axis === 'x') {
        // Wall along Z, doorway gap along Z around pz
        if (Math.abs(nextPos.x - px) < 0.4 && Math.abs(nextPos.z - pz) < halfW) {
          // Inside doorway opening: allowed!
          return { pos: nextPos, collided: false, inDoorway: true, portalName: p.name };
        }
      } else {
        // Wall along X, doorway gap along X around px
        if (Math.abs(nextPos.z - pz) < 0.4 && Math.abs(nextPos.x - px) < halfW) {
          return { pos: nextPos, collided: false, inDoorway: true, portalName: p.name };
        }
      }
    }

    // Test collision against solid obstacles
    let collided = false;
    for (const obs of obstacles) {
      const minX = obs.x - obs.hx - radius;
      const maxX = obs.x + obs.hx + radius;
      const minZ = obs.z - obs.hz - radius;
      const maxZ = obs.z + obs.hz + radius;

      if (nextPos.x >= minX && nextPos.x <= maxX && nextPos.z >= minZ && nextPos.z <= maxZ) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      return { pos: nextPos, collided: false };
    }

    // Collision detected: Attempt sliding along X
    let canSlideX = true;
    const testSlideX = new THREE.Vector3(nextPos.x, currPos.y, currPos.z);
    for (const obs of obstacles) {
      if (testSlideX.x >= obs.x - obs.hx - radius && testSlideX.x <= obs.x + obs.hx + radius &&
          testSlideX.z >= obs.z - obs.hz - radius && testSlideX.z <= obs.z + obs.hz + radius) {
        canSlideX = false;
        break;
      }
    }
    if (canSlideX) {
      return { pos: testSlideX, collided: true, slid: 'x' };
    }

    // Attempt sliding along Z
    let canSlideZ = true;
    const testSlideZ = new THREE.Vector3(currPos.x, currPos.y, nextPos.z);
    for (const obs of obstacles) {
      if (testSlideZ.x >= obs.x - obs.hx - radius && testSlideZ.x <= obs.x + obs.hx + radius &&
          testSlideZ.z >= obs.z - obs.hz - radius && testSlideZ.z <= obs.z + obs.hz + radius) {
        canSlideZ = false;
        break;
      }
    }
    if (canSlideZ) {
      return { pos: testSlideZ, collided: true, slid: 'z' };
    }

    // Completely blocked by wall
    return { pos: currPos.clone(), collided: true, blocked: true };
  }
}

export const navigationEngine = new NavigationEngine();
if (typeof window !== 'undefined') {
  window.__wolfNavEngine = navigationEngine;
}
