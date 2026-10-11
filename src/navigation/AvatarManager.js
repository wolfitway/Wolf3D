/**
 * Wolf3D Autonomous 3D Architectural People & Avatar Crowd Engine
 * 
 * Creates procedural high-aesthetic 3D human figures with natural kinematic walking cycles,
 * intelligent door-navigation steering, real-time status updates, and path ribbons.
 */

import * as THREE from 'three';
import { navigationEngine } from './navigationEngine';
import { playFootstep } from '../audio/audioSystem';

/**
 * VIP Tour Guide Waypoints & Presentation Positions
 */
export const GUIDE_TOUR_STOPS = {
  villa: {
    entrance: { pos: { x: -2.6, z: 1.8 }, yaw: -Math.PI / 4, speech: "Welcome to Villa Wolfitway. Let's explore the sunlit Mediterranean diorama." },
    salon: { pos: { x: -1.4, z: 0.2 }, yaw: -Math.PI / 2, speech: "Here is our Grand Living Salon featuring Nordic wool bouclé seating and fluted joinery." },
    kitchen: { pos: { x: 2.8, z: -1.0 }, yaw: Math.PI, speech: "The Gourmet Chef's Island with Calacatta Viola marble and integrated induction." },
    suite: { pos: { x: 2.2, z: 1.0 }, yaw: -Math.PI / 3, speech: "The Master Bedroom Retreat with acoustic fluted timber and platform bed." },
    terrace: { pos: { x: -4.8, z: -0.8 }, yaw: Math.PI / 2, speech: "The Sunset Panoramic Terrace framing radiant golden light across the cantilever." },
    dollhouse: { pos: { x: -1.0, z: 0.2 }, yaw: -Math.PI / 4, speech: "An elevated isometric perspective displaying the spatial zoning and flow." }
  },
  studio: {
    entrance: { pos: { x: -0.6, z: 1.8 }, yaw: 0, speech: "Welcome to the Adaptive Micro Studio, engineered for maximum light and spatial efficiency." },
    salon: { pos: { x: -0.8, z: 0.2 }, yaw: -Math.PI / 2, speech: "Modular millwork core that transforms between desk, dining, and relaxation." },
    kitchen: { pos: { x: 0.8, z: -0.8 }, yaw: Math.PI / 2, speech: "Integrated chef kitchenette with concealed sliding pocket doors." },
    suite: { pos: { x: 0.6, z: 0.8 }, yaw: Math.PI / 2, speech: "Kinetic sleeping sanctuary featuring an illuminated fold-out Murphy setup." },
    terrace: { pos: { x: 0.0, z: 3.2 }, yaw: 0, speech: "Sunset balcony overlooking the outdoor threshold." },
    dollhouse: { pos: { x: -0.4, z: 0.2 }, yaw: 0, speech: "Complete architectural cutaway of the 35.4 M² adaptive layout." }
  },
  loft: {
    entrance: { pos: { x: -1.8, z: 2.2 }, yaw: -Math.PI / 4, speech: "Welcome to the Industrial Creative Loft with double-height volume." },
    salon: { pos: { x: -1.2, z: 0.6 }, yaw: -Math.PI / 2, speech: "Open atelier workspace and platform lounge supporting creative work and social leisure." },
    kitchen: { pos: { x: 1.2, z: -1.0 }, yaw: Math.PI / 2, speech: "Monolithic charcoal quartz bar acting as the social centerpiece." },
    suite: { pos: { x: 1.6, z: 1.2 }, yaw: Math.PI / 2, speech: "Elevated platform tatami bedroom suite overlooking the loft glazing." },
    terrace: { pos: { x: -0.8, z: 4.2 }, yaw: 0, speech: "High sky deck with expansive panoramic aperture." },
    dollhouse: { pos: { x: -0.4, z: 0.2 }, yaw: 0, speech: "Bird-eye diorama of the 63 M² open industrial volume." }
  }
};

export class AvatarAgent {
  constructor(id, name, colorHex, startRoomId = 'salon', scene) {
    this.id = id;
    this.name = name;
    this.colorHex = colorHex;
    this.scene = scene;

    this.currentRoom = startRoomId;
    this.targetRoom = null;
    this.path = [];
    this.pathIndex = 0;
    this.isMoving = false;
    this.idleTimer = Math.random() * 2.0; // Seconds to linger in room before next walk
    this.speed = 1.65; // Human strolling speed: ~1.65 m/s
    this.walkPhase = 0;
    this.statusText = `${name} • Relaxing in ${startRoomId}`;

    // VIP Tour Guide State
    this.isTourGuide = false;
    this.targetFacingYaw = null;
    this.guideSpeech = '';
    this.currentTourStopTitle = '';

    // 3D Visual Objects
    this.root = new THREE.Group();
    this.root.name = `avatar_${id}`;

    this.buildMesh();
    this.initPathRibbon();

    // Place in initial room
    const layout = navigationEngine.getLayoutData();
    const room = layout.rooms[startRoomId] || Object.values(layout.rooms)[0];
    const initialPos = room ? room.center : { x: -2.5, z: 0 };
    this.root.position.set(initialPos.x + (Math.random() - 0.5) * 0.8, 0, initialPos.z + (Math.random() - 0.5) * 0.8);
    this.targetYaw = Math.random() * Math.PI * 2;
    this.root.rotation.y = this.targetYaw;

    if (this.scene) {
      this.scene.add(this.root);
    }
  }

  buildMesh() {
    // Elegant Architectural Mannequin Figure (Height ~1.76m)
    const figureMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      roughness: 0.42,
      metalness: 0.15
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x22201e,
      roughness: 0.6
    });

    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf5eee6,
      roughness: 0.5
    });

    // 1. Soft Floor Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.55, 0.55);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x100e0c,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.root.add(shadow);
    this.shadowMesh = shadow;

    // 2. Pelvis / Hip Pivot
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.root.add(this.pelvis);

    // Torso / Jacket
    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.55, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, figureMat);
    torsoMesh.position.y = 0.28;
    torsoMesh.castShadow = true;
    this.pelvis.add(torsoMesh);

    // Chest / Collar Lapel accent
    const lapelGeo = new THREE.BoxGeometry(0.18, 0.32, 0.12);
    const lapelMesh = new THREE.Mesh(lapelGeo, darkAccentMat);
    lapelMesh.position.set(0, 0.36, 0.08);
    this.pelvis.add(lapelMesh);

    // 3. Head & Hair crest
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.62;
    this.pelvis.add(headPivot);
    this.headPivot = headPivot;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), headMat);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.15), darkAccentMat);
    hairMesh.position.set(0, 0.07, -0.01);
    headPivot.add(hairMesh);

    // 4. Arms
    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.24, 0.50, 0);
    this.pelvis.add(this.leftArm);
    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.48, 8), figureMat);
    lArmMesh.position.y = -0.22;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.24, 0.50, 0);
    this.pelvis.add(this.rightArm);
    const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.48, 8), figureMat);
    rArmMesh.position.y = -0.22;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);

    // 5. Legs
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.10, 0, 0);
    this.pelvis.add(this.leftLeg);
    const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.88, 8), darkAccentMat);
    lLegMesh.position.y = -0.44;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);
    // Left Shoe
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.20), darkAccentMat);
    lShoe.position.set(0, -0.90, 0.04);
    this.leftLeg.add(lShoe);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.10, 0, 0);
    this.pelvis.add(this.rightLeg);
    const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.88, 8), darkAccentMat);
    rLegMesh.position.y = -0.44;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
    // Right Shoe
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.20), darkAccentMat);
    rShoe.position.set(0, -0.90, 0.04);
    this.rightLeg.add(rShoe);

    // 6. Overhead Minimalist Architectural Badge
    this.badgeCanvas = document.createElement('canvas');
    this.badgeCanvas.width = 384;
    this.badgeCanvas.height = 96;
    this.badgeTexture = new THREE.CanvasTexture(this.badgeCanvas);
    this.updateBadgeCanvas(this.name, 'Relaxing in Salon');

    const badgeMat = new THREE.SpriteMaterial({
      map: this.badgeTexture,
      transparent: true,
      opacity: 0.95,
      depthTest: false
    });
    this.badgeSprite = new THREE.Sprite(badgeMat);
    this.badgeSprite.scale.set(1.4, 0.35, 1);
    this.badgeSprite.position.y = 2.05;
    this.root.add(this.badgeSprite);
  }

  updateBadgeCanvas(title, subtitle) {
    const ctx = this.badgeCanvas.getContext('2d');
    ctx.clearRect(0, 0, 384, 96);

    // Glass pill background
    ctx.fillStyle = this.isTourGuide ? 'rgba(24, 20, 15, 0.94)' : 'rgba(28, 25, 22, 0.82)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 364, 76, 24);
    ctx.fill();

    // Accent border (Gold for VIP Guide, Amber for occupants)
    ctx.strokeStyle = this.isTourGuide ? 'rgba(229, 184, 105, 0.95)' : 'rgba(217, 130, 59, 0.7)';
    ctx.lineWidth = this.isTourGuide ? 4 : 3;
    ctx.stroke();

    // Person Dot / Star Icon
    if (this.isTourGuide) {
      ctx.fillStyle = '#e5b869';
      ctx.font = '22px sans-serif';
      ctx.fillText('⭐', 22, 54);
    } else {
      ctx.fillStyle = `#${this.colorHex.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(36, 48, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title
    ctx.fillStyle = this.isTourGuide ? '#fbe5b5' : '#f8f5f0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(title, 58, 42);

    // Subtitle
    ctx.fillStyle = this.isTourGuide ? '#d5c7b3' : '#b8aea2';
    ctx.font = '15px sans-serif';
    ctx.fillText(subtitle, 58, 66);

    this.badgeTexture.needsUpdate = true;
  }

  initPathRibbon() {
    const maxPoints = 50;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xe69138,
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });

    this.pathRibbon = new THREE.Line(geom, mat);
    this.pathRibbon.frustumCulled = false;
    this.pathRibbon.visible = false;
    if (this.scene) {
      this.scene.add(this.pathRibbon);
    }
  }

  updatePathRibbonVisual() {
    if (!this.pathRibbon) return;
    if (!this.isMoving || this.path.length < 2) {
      this.pathRibbon.visible = false;
      return;
    }

    this.pathRibbon.visible = true;
    const posAttr = this.pathRibbon.geometry.attributes.position;
    const arr = posAttr.array;

    // Remaining waypoints from current position onwards
    let pointCount = 0;
    // Current avatar pos
    arr[0] = this.root.position.x;
    arr[1] = 0.035; // slightly above floor
    arr[2] = this.root.position.z;
    pointCount++;

    for (let i = this.pathIndex; i < this.path.length && pointCount < 50; i++) {
      const wp = this.path[i];
      arr[pointCount * 3] = wp.x;
      arr[pointCount * 3 + 1] = 0.035;
      arr[pointCount * 3 + 2] = wp.z;
      pointCount++;
    }

    // Fill remaining points with last pos
    for (let k = pointCount; k < 50; k++) {
      arr[k * 3] = arr[(pointCount - 1) * 3];
      arr[k * 3 + 1] = arr[(pointCount - 1) * 3 + 1];
      arr[k * 3 + 2] = arr[(pointCount - 1) * 3 + 2];
    }

    this.pathRibbon.geometry.setDrawRange(0, pointCount);
    posAttr.needsUpdate = true;
  }

  /**
   * Order avatar to walk to a target room or (x, z) location through doorways
   */
  walkTo(targetCoordOrRoomId, onStepCallback) {
    const layout = navigationEngine.getLayoutData();
    let targetPos = null;
    let roomLabel = '';

    if (typeof targetCoordOrRoomId === 'string') {
      const room = layout.rooms[targetCoordOrRoomId];
      if (room) {
        targetPos = {
          x: room.center.x + (Math.random() - 0.5) * 1.0,
          z: room.center.z + (Math.random() - 0.5) * 1.0
        };
        roomLabel = room.name;
        this.targetRoom = targetCoordOrRoomId;
      }
    } else if (targetCoordOrRoomId && targetCoordOrRoomId.x !== undefined) {
      targetPos = targetCoordOrRoomId;
      const targetRoom = navigationEngine.getRoomAt(targetPos.x, targetPos.z);
      roomLabel = targetRoom ? targetRoom.name : 'Target Spot';
      this.targetRoom = targetRoom ? targetRoom.id : null;
    }

    if (!targetPos) return false;

    // Generate intelligent path through doorways avoiding walls
    const startPos = { x: this.root.position.x, z: this.root.position.z };
    const fullPath = navigationEngine.findPath(startPos, targetPos);

    if (fullPath.length <= 1) return false;

    this.path = fullPath;
    this.pathIndex = 1;
    this.isMoving = true;
    this.onStepCallback = onStepCallback;
    this.speed = this.isTourGuide ? 3.2 : 1.65;

    const firstWp = this.path[1];
    this.statusText = `${this.name} • Walking towards ${firstWp.note || roomLabel}`;
    this.updateBadgeCanvas(this.name, firstWp.note || `En Route to ${roomLabel}`);

    return true;
  }

  /**
   * Main per-frame update loop
   */
  update(delta) {
    if (!this.root.visible) return;

    if (this.isMoving && this.path.length > 0 && this.pathIndex < this.path.length) {
      const targetWp = this.path[this.pathIndex];
      const currentPos = this.root.position;

      const dx = targetWp.x - currentPos.x;
      const dz = targetWp.z - currentPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Smoothly steer/rotate towards waypoint
      if (dist > 0.05) {
        this.targetYaw = Math.atan2(dx, dz);
        // Interpolate rotation
        let diff = this.targetYaw - this.root.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.root.rotation.y += diff * Math.min(1.0, delta * 9.0);
      }

      // Step forward
      const stepDist = Math.min(dist, this.speed * delta);
      if (dist > 0.001) {
        currentPos.x += (dx / dist) * stepDist;
        currentPos.z += (dz / dist) * stepDist;
      }

      // Animate walking limbs
      this.walkPhase += delta * this.speed * 6.5;
      const legAngle = Math.sin(this.walkPhase) * 0.45;
      const armAngle = -Math.sin(this.walkPhase) * 0.35;

      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;

      // Natural vertical hip bob & torso sway
      this.pelvis.position.y = 0.95 + Math.abs(Math.cos(this.walkPhase)) * 0.035;
      this.pelvis.rotation.z = Math.sin(this.walkPhase) * 0.04;

      // Waypoint reached?
      if (dist < 0.22) {
        if (targetWp.isThreshold) {
          // Walking through the door threshold!
          this.statusText = `${this.name} • 🚪 Passing through ${targetWp.note || 'Door'}`;
          this.updateBadgeCanvas(this.name, `🚪 Crossing Doorway`);
          if (this.onStepCallback) {
            this.onStepCallback(this, 'door_threshold', targetWp);
          }
        }

        this.pathIndex++;

        if (this.pathIndex < this.path.length) {
          const nextWp = this.path[this.pathIndex];
          this.updateBadgeCanvas(this.name, nextWp.note || 'Navigating');
        } else {
          // Reached final destination!
          this.isMoving = false;
          this.path = [];
          this.idleTimer = 3.5 + Math.random() * 4.0; // Rest in this room
          this.currentRoom = this.targetRoom || navigationEngine.getRoomAt(currentPos.x, currentPos.z)?.id;
          const roomObj = navigationEngine.getLayoutData().rooms[this.currentRoom];
          const roomName = roomObj ? roomObj.name : 'Room';
          
          if (this.isTourGuide) {
            this.speed = 1.65;
            if (this.targetFacingYaw !== null && this.targetFacingYaw !== undefined) {
              this.targetYaw = this.targetFacingYaw;
              this.root.rotation.y = this.targetFacingYaw;
            }
            this.statusText = `${this.name} (VIP Guide) • Presenting ${this.currentTourStopTitle || roomName}`;
            this.updateBadgeCanvas(`⭐ Sophia • VIP Guide`, `Presenting ${this.currentTourStopTitle || roomName}`);
          } else {
            this.statusText = `${this.name} • Arrived at ${roomName}`;
            this.updateBadgeCanvas(this.name, `Exploring ${roomName}`);
          }

          // Reset limbs to neutral stand
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
          this.leftArm.rotation.x = 0;
          this.rightArm.rotation.x = 0;
          this.pelvis.position.y = 0.95;
          this.pelvis.rotation.z = 0;

          if (this.onStepCallback) {
            this.onStepCallback(this, 'arrived', this.currentRoom);
          }
        }
      }

      this.updatePathRibbonVisual();
    } else {
      // Idle state
      if (this.isTourGuide) {
        // VIP Tour Guide presentation idle stance:
        // Gentle breathing, head facing audience/room, right arm raised in elegant presentation gesture
        this.walkPhase += delta * 1.5;
        this.pelvis.position.y = 0.95 + Math.sin(this.walkPhase) * 0.007;
        this.headPivot.rotation.y = Math.sin(this.walkPhase * 0.4) * 0.08;

        // Welcoming presentation gesture with right arm
        this.rightArm.rotation.x = -0.55 + Math.sin(this.walkPhase * 0.7) * 0.04;
        this.rightArm.rotation.z = 0.36 + Math.sin(this.walkPhase * 0.7) * 0.02;
        this.leftArm.rotation.x = 0;
        this.leftArm.rotation.z = -0.05;

        // Smoothly rotate to presentation target yaw
        if (this.targetFacingYaw !== null && this.targetFacingYaw !== undefined) {
          let diff = this.targetFacingYaw - this.root.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.root.rotation.y += diff * Math.min(1.0, delta * 5.0);
        }
      } else {
        // Autonomous wander to another room through doors!
        this.walkPhase += delta * 1.8;
        this.pelvis.position.y = 0.95 + Math.sin(this.walkPhase) * 0.008;
        this.headPivot.rotation.y = Math.sin(this.walkPhase * 0.5) * 0.12;

        this.idleTimer -= delta;
        if (this.idleTimer <= 0) {
          this.wanderToNextRoom();
        }
      }

      if (this.pathRibbon) {
        this.pathRibbon.visible = false;
      }
    }
  }

  /**
   * Autonomous wander: randomly picks another room and walks there via doors
   */
  wanderToNextRoom() {
    const layout = navigationEngine.getLayoutData();
    const roomKeys = Object.keys(layout.rooms);
    if (roomKeys.length <= 1) return;

    // Pick a different room
    const choices = roomKeys.filter(k => k !== this.currentRoom);
    const nextRoomKey = choices[Math.floor(Math.random() * choices.length)];

    this.walkTo(nextRoomKey);
  }

  dispose() {
    if (this.root && this.scene) {
      this.scene.remove(this.root);
    }
    if (this.pathRibbon && this.scene) {
      this.scene.remove(this.pathRibbon);
      if (this.pathRibbon.geometry) this.pathRibbon.geometry.dispose();
      if (this.pathRibbon.material) this.pathRibbon.material.dispose();
    }
  }
}

/**
 * AvatarManager coordinates the full crowd of occupants
 */
export class AvatarManager {
  constructor() {
    this.scene = null;
    this.agents = [];
    this.isVisible = true;
    this.showPathRibbon = true;
    this.doorCallback = null;
  }

  init(scene) {
    this.scene = scene;
    if (typeof window !== 'undefined') {
      window.__wolfAvatarManager = this;
    }
    this.resetAgents(2);
  }

  resetAgents(count = 2) {
    // Clear existing
    this.agents.forEach(a => a.dispose());
    this.agents = [];

    if (!this.scene) return;

    const agentConfigs = [
      { id: 'sophia', name: 'Sophia (Lead Architect)', color: 0x3d78c2, room: 'salon' },
      { id: 'marcus', name: 'Marcus (VIP Client)', color: 0xd9823b, room: 'kitchen' },
      { id: 'elena', name: 'Elena (Design Director)', color: 0x5a8b6f, room: 'suite' }
    ];

    for (let i = 0; i < Math.min(count, agentConfigs.length); i++) {
      const cfg = agentConfigs[i];
      const agent = new AvatarAgent(cfg.id, cfg.name, cfg.color, cfg.room, this.scene);
      this.agents.push(agent);
    }
  }

  setCount(count) {
    this.resetAgents(count);
  }

  setVisible(visible) {
    this.isVisible = visible;
    this.agents.forEach(a => {
      a.root.visible = visible;
      if (a.pathRibbon) a.pathRibbon.visible = visible && this.showPathRibbon;
    });
  }

  setShowPathRibbon(show) {
    this.showPathRibbon = show;
    this.agents.forEach(a => {
      if (a.pathRibbon) a.pathRibbon.visible = show && a.isMoving;
    });
  }

  onPlanChanged(plan, dimensions) {
    navigationEngine.setPlan(plan, dimensions);
    this.resetAgents(this.agents.length || 2);
  }

  sendAgentToRoom(agentIndex = 0, roomId) {
    if (this.agents[agentIndex]) {
      this.agents[agentIndex].walkTo(roomId);
    }
  }

  sendAllToRoom(roomId) {
    this.agents.forEach(a => a.walkTo(roomId));
  }

  sendToClickCoord(coord) {
    if (this.agents.length > 0) {
      // Pick first free or nearest agent
      this.agents[0].walkTo(coord);
    }
  }

  /**
   * VIP Tour Guide Orchestration: Sophia leads the tour stop
   */
  guideTourStop(stopInfo, housePlan = 'villa') {
    if (!this.agents || this.agents.length === 0) return;
    const guide = this.agents[0]; // Sophia (Lead Architect & VIP Tour Guide)
    guide.isTourGuide = true;

    const key = stopInfo.key || 'salon';
    const planConfig = GUIDE_TOUR_STOPS[housePlan] || GUIDE_TOUR_STOPS.villa;
    const stopCfg = planConfig[key] || planConfig.salon || {
      pos: { x: -1.5, z: 0 },
      yaw: 0,
      speech: stopInfo.desc || 'Presenting room'
    };

    guide.targetFacingYaw = stopCfg.yaw;
    guide.guideSpeech = stopCfg.speech || stopInfo.desc;
    guide.currentTourStopTitle = stopInfo.title;
    this.activeGuideSpeech = guide.guideSpeech;
    this.activeGuideStop = stopInfo.title;

    guide.walkTo(stopCfg.pos, (agent, eventType) => {
      if (eventType === 'arrived') {
        agent.targetFacingYaw = stopCfg.yaw;
        agent.targetYaw = stopCfg.yaw;
        agent.statusText = `Sophia (VIP Guide) • Presenting ${stopInfo.title}`;
        agent.updateBadgeCanvas(`⭐ Sophia • VIP Guide`, `Presenting ${stopInfo.title}`);
      }
    });

    guide.statusText = `Sophia (VIP Guide) • Guiding to ${stopInfo.title}`;
    guide.updateBadgeCanvas(`⭐ Sophia • VIP Guide`, `Guiding to ${stopInfo.title}`);
  }

  onTourEnded() {
    this.activeGuideSpeech = '';
    this.activeGuideStop = '';
    if (this.agents && this.agents[0]) {
      const guide = this.agents[0];
      guide.isTourGuide = false;
      guide.targetFacingYaw = null;
      guide.rightArm.rotation.x = 0;
      guide.rightArm.rotation.z = 0;
      guide.statusText = `${guide.name} • Relaxing in ${guide.currentRoom}`;
      guide.updateBadgeCanvas(guide.name, `Relaxing in ${guide.currentRoom}`);
    }
  }

  getGuideInfo() {
    if (!this.agents || this.agents.length === 0) return null;
    const guide = this.agents[0];
    return {
      isActive: guide.isTourGuide,
      name: guide.name,
      currentStop: guide.currentTourStopTitle || guide.currentRoom,
      speech: guide.guideSpeech || this.activeGuideSpeech || '',
      statusText: guide.statusText,
      isMoving: guide.isMoving,
      position: guide.root ? { x: guide.root.position.x, y: guide.root.position.y, z: guide.root.position.z } : null
    };
  }

  update(delta) {
    if (!this.isVisible) return;
    this.agents.forEach(a => a.update(delta));
  }

  getStatuses() {
    return this.agents.map(a => a.statusText);
  }
}

export const avatarManager = new AvatarManager();
