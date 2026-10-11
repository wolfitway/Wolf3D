import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  appModeAtom,
  housePlanAtom,
  styleThemeAtom,
  cameraViewAtom,
  circadianModeIndexAtom,
  atmosphereMoodAtom,
  showDimensionsAtom,
  selectedPropIdAtom,
  spawnedPropsAtom,
  roomDimensionsAtom,
  curtainStateAtom,
  activeSpecHotspotAtom,
  hotspotTooltipAtom,
  isTourActiveAtom,
  isTourPausedAtom,
  tourStopIndexAtom,
  tourProgressAtom,
  tourSpeedAtom,
  customTourMovesAtom,
  isLightFixturesOnAtom,
  showOutdoorTerraceAtom,
  isGrabbingPropAtom,
  grabAxisLockAtom,
  placementValidAtom,
  placementReasonAtom,
  isStructuralLockedAtom,
  lockedElementIdsAtom,
  showCadRoomTagsAtom,
  showCadDoorSwingsAtom,
  activeRoomFilterAtom,
  isMeasureToolActiveAtom,
  laserMeasurementsAtom
} from '../../store/atoms';
import { STYLES, ATMOSPHERE_MOODS, ROOM_BOOKMARKS, TOUR_ROUTES, HOTSPOTS_DATA, CAMERA_PRESETS, PROPS_META, INITIAL_MEDITERRANEAN_PROPS, ROOM_ZONES, STRUCTURAL_META } from '../../data/constants';
import {
  createSunsetCanvas,
  createCodeScreenCanvas,
  createModernArtCanvas,
  createCrateWoodTexture,
  createTerracottaTileTexture,
  createCedarWoodTexture,
  createTravertineTexture,
  createLinenTexture,
  createLimewashPlasterTexture,
  createPlasterBumpMap,
  createFlutedWoodTexture,
  createWovenLinenCurtainTexture,
  createZoneBadge,
  createDimensionLabelTexture,
  createLaserMeasureBadgeTexture
} from '../../textures/proceduralTextures';
import { physicsEngine } from '../../physics/physicsEngine';
import { playChime, playThud, playSnap, playFootstep, playSwitch, playDoorSlide, playDrawerSlide } from '../../audio/audioSystem';
import {
  createFurnitureMaterials,
  buildFurnitureModel,
  buildMediterraneanBed,
  buildArchitecturalCurtains
} from './furnitureModels';
import { createGlbFurnitureModel } from './glbFurnitureLoader';
import { buildCustomImageModel } from './ImageTo3DGenerator.js';
import { navigationEngine } from '../../navigation/navigationEngine';
import { avatarManager } from '../../navigation/AvatarManager';

export default function HouseScene() {
  const containerRef = useRef(null);

  const [appMode, setAppMode] = useAtom(appModeAtom);
  const [housePlan, setHousePlan] = useAtom(housePlanAtom);
  const styleTheme = useAtomValue(styleThemeAtom);
  const [cameraView, setCameraView] = useAtom(cameraViewAtom);
  const circadianModeIndex = useAtomValue(circadianModeIndexAtom);
  const atmosphereMood = useAtomValue(atmosphereMoodAtom);
  const showDimensions = useAtomValue(showDimensionsAtom);
  const [selectedPropId, setSelectedPropId] = useAtom(selectedPropIdAtom);
  const [spawnedProps, setSpawnedProps] = useAtom(spawnedPropsAtom);
  const [roomDimensions, setRoomDimensions] = useAtom(roomDimensionsAtom);
  const curtainState = useAtomValue(curtainStateAtom);
  const setActiveSpecHotspot = useSetAtom(activeSpecHotspotAtom);
  const setHotspotTooltip = useSetAtom(hotspotTooltipAtom);

  const [isGrabbingProp, setIsGrabbingProp] = useAtom(isGrabbingPropAtom);
  const [grabAxisLock, setGrabAxisLock] = useAtom(grabAxisLockAtom);
  const setPlacementValid = useSetAtom(placementValidAtom);
  const setPlacementReason = useSetAtom(placementReasonAtom);

  const [isTourActive, setIsTourActive] = useAtom(isTourActiveAtom);
  const isTourPaused = useAtomValue(isTourPausedAtom);
  const [tourStopIndex, setTourStopIndex] = useAtom(tourStopIndexAtom);
  const setTourProgress = useSetAtom(tourProgressAtom);
  const tourSpeed = useAtomValue(tourSpeedAtom);
  const customTourMoves = useAtomValue(customTourMovesAtom);

  const [isLightFixturesOn, setIsLightFixturesOn] = useAtom(isLightFixturesOnAtom);
  const showOutdoorTerrace = useAtomValue(showOutdoorTerraceAtom);
  const isStructuralLocked = useAtomValue(isStructuralLockedAtom);
  const lockedElementIds = useAtomValue(lockedElementIdsAtom);
  const showCadRoomTags = useAtomValue(showCadRoomTagsAtom);
  const showCadDoorSwings = useAtomValue(showCadDoorSwingsAtom);
  const activeRoomFilter = useAtomValue(activeRoomFilterAtom);
  const [isMeasureToolActive, setIsMeasureToolActive] = useAtom(isMeasureToolActiveAtom);
  const [laserMeasurements, setLaserMeasurements] = useAtom(laserMeasurementsAtom);

  // References for Three.js engine
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const houseGroupRef = useRef(null);
  const terraceGroupRef = useRef(null);
  const hotspotsGroupRef = useRef(null);
  const dimensionsGroupRef = useRef(null);
  const propsGroupRef = useRef(null);
  const selectionRingRef = useRef(null);
  const placementProjectorRef = useRef(null);
  const structuralMeshesRef = useRef(new Map());
  const cadPresentationGroupRef = useRef(null);
  const measurementsGroupRef = useRef(null);
  const activeMeasurePreviewRef = useRef(null);
  const measureStartPointRef = useRef(null);

  // Blender-style active grab tracking
  const activeGrabRef = useRef({
    isGrabbing: false,
    propId: null,
    isStructural: false,
    initialX: 0,
    initialY: 0,
    initialZ: 0,
    initialRot: null,
    axisLock: null,
    liftY: 0.12,
    isPointerDown: false
  });

  // Stale-closure protection refs for event listeners & RAF
  const selectedPropIdRef = useRef(selectedPropId);
  const roomDimensionsRef = useRef(roomDimensions);
  const appModeRef = useRef(appMode);
  const cameraViewRef = useRef(cameraView);
  const showOutdoorTerraceRef = useRef(showOutdoorTerrace);
  const isStructuralLockedRef = useRef(isStructuralLocked);
  const lockedElementIdsRef = useRef(lockedElementIds);
  const showCadRoomTagsRef = useRef(showCadRoomTags);
  const showCadDoorSwingsRef = useRef(showCadDoorSwings);
  const isMeasureToolActiveRef = useRef(isMeasureToolActive);
  const laserMeasurementsRef = useRef(laserMeasurements);

  useEffect(() => { selectedPropIdRef.current = selectedPropId; }, [selectedPropId]);
  useEffect(() => { roomDimensionsRef.current = roomDimensions; }, [roomDimensions]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);
  useEffect(() => { cameraViewRef.current = cameraView; }, [cameraView]);
  useEffect(() => { showOutdoorTerraceRef.current = showOutdoorTerrace; }, [showOutdoorTerrace]);
  useEffect(() => { isStructuralLockedRef.current = isStructuralLocked; }, [isStructuralLocked]);
  useEffect(() => { lockedElementIdsRef.current = lockedElementIds; }, [lockedElementIds]);
  useEffect(() => { showCadRoomTagsRef.current = showCadRoomTags; }, [showCadRoomTags]);
  useEffect(() => { showCadDoorSwingsRef.current = showCadDoorSwings; }, [showCadDoorSwings]);
  useEffect(() => { isMeasureToolActiveRef.current = isMeasureToolActive; }, [isMeasureToolActive]);
  useEffect(() => { laserMeasurementsRef.current = laserMeasurements; }, [laserMeasurements]);

  // Lighting refs
  const ambientLightRef = useRef(null);
  const sunLightRef = useRef(null);
  const fireLightRef = useRef(null);
  const diningLightRef = useRef(null);

  // Joinery & living animated refs
  const murphyPivotRef = useRef(null);
  const deskFoldRef = useRef(null);
  const chairGroupRef = useRef(null);
  const slidingDoorRef = useRef(null);
  const diningLeafRef = useRef(null);
  const projScreenRef = useRef(null);
  const projLightRef = useRef(null);
  const bedLightRef = useRef(null);
  const waterMeshRef = useRef(null);
  const villaDoorRef = useRef(null);
  const isVillaDoorOpenRef = useRef(false);

  // Interactive tracking
  const hotspotCollidersRef = useRef([]);
  const interactiveObjectsRef = useRef([]);
  const draggedPropRef = useRef(null);
  const walkKeysRef = useRef({ forward: false, backward: false, left: false, right: false });
  const walkRotRef = useRef({ yaw: 0, pitch: 0 });
  const walkStepTimerRef = useRef(0);
  const walkBobPhaseRef = useRef(0);
  const isWalkingDragRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // 3D Blender Placement & Footprint Projector Visual updater
  const updateFootprintVisuals = (propId, posX, posZ, rotQ, isGrabbing, axisLock) => {
    if (!placementProjectorRef.current) return;
    const p = placementProjectorRef.current;
    if (appModeRef.current !== 'studio' || !propId) {
      p.group.visible = false;
      return;
    }

    const record = physicsEngine.physicsObjects.get(propId);
    if (!record || !record.body) {
      p.group.visible = false;
      return;
    }

    p.group.visible = true;
    const type = record.type;
    const dim = physicsEngine.getDimensions(type);
    const halfW = dim.width / 2;
    const halfD = dim.depth / 2;

    p.footprint.position.set(posX, 0.015, posZ);
    if (rotQ) {
      p.footprint.quaternion.copy(rotQ);
    }

    p.plane.scale.set(dim.width, dim.depth, 1);
    p.outline.scale.set(dim.width, 1, dim.depth);
    p.contactShadow.scale.set(dim.width * 1.15, dim.depth * 1.15, 1);

    // Dynamic 4 corner brackets
    const cSize = Math.min(0.22, Math.min(halfW, halfD) * 0.45);
    const cPts = [
      new THREE.Vector3(-halfW, 0.002, -halfD), new THREE.Vector3(-halfW + cSize, 0.002, -halfD),
      new THREE.Vector3(-halfW, 0.002, -halfD), new THREE.Vector3(-halfW, 0.002, -halfD + cSize),
      new THREE.Vector3(halfW, 0.002, -halfD), new THREE.Vector3(halfW - cSize, 0.002, -halfD),
      new THREE.Vector3(halfW, 0.002, -halfD), new THREE.Vector3(halfW, 0.002, -halfD + cSize),
      new THREE.Vector3(halfW, 0.002, halfD), new THREE.Vector3(halfW - cSize, 0.002, halfD),
      new THREE.Vector3(halfW, 0.002, halfD), new THREE.Vector3(halfW, 0.002, halfD - cSize),
      new THREE.Vector3(-halfW, 0.002, halfD), new THREE.Vector3(-halfW + cSize, 0.002, halfD),
      new THREE.Vector3(-halfW, 0.002, halfD), new THREE.Vector3(-halfW, 0.002, halfD - cSize)
    ];
    p.cornerMat.geometry.dispose();
    p.cornerMat.geometry = new THREE.BufferGeometry().setFromPoints(cPts);

    // Boundary & Collision Validation
    const roomW = roomDimensionsRef.current.width;
    const roomD = roomDimensionsRef.current.depth;
    const wallMinX = -roomW / 2 + 0.35;
    const wallMaxX = roomW / 2 - 0.35;
    const wallMinZ = -roomD / 2 + 0.35;
    const wallMaxZ = roomD / 2 - 0.35;

    let isValid = true;
    let reason = 'Valid Placement Zone';

    if (posX - halfW < wallMinX || posX + halfW > wallMaxX || posZ - halfD < wallMinZ || posZ + halfD > wallMaxZ) {
      isValid = false;
      reason = 'Outside Room Perimeter';
    }

    if (isValid) {
      for (const [otherId, otherRecord] of physicsEngine.physicsObjects.entries()) {
        if (otherId === propId || !otherRecord.body) continue;
        const ot = otherRecord.body.translation();
        const odim = physicsEngine.getDimensions(otherRecord.type);
        const oHalfW = odim.width / 2;
        const oHalfD = odim.depth / 2;
        const overlapX = (halfW + oHalfW) - Math.abs(posX - ot.x);
        const overlapZ = (halfD + oHalfD) - Math.abs(posZ - ot.z);
        if (overlapX > 0.08 && overlapZ > 0.08) {
          const suppY = physicsEngine.getSupportingSurfaceY(posX, posZ, propId, type);
          if (suppY <= 0.05) {
            isValid = false;
            reason = 'Collision with Furniture';
            break;
          }
        }
      }
    }

    const color = isValid ? 0x00f5d4 : 0xef4444;
    p.planeMat.color.setHex(color);
    p.planeMat.opacity = isValid ? (isGrabbing ? 0.38 : 0.25) : 0.60;
    p.boxMat.color.setHex(color);

    setPlacementValid(isValid);
    setPlacementReason(reason);

    // Wall Guide Lines
    const westX = -roomW / 2;
    const eastX = roomW / 2;
    const northZ = -roomD / 2;
    const southZ = roomD / 2;

    const guides = p.wallGuides;
    const westPts = [new THREE.Vector3(posX - halfW, 0.015, posZ), new THREE.Vector3(westX, 0.015, posZ)];
    guides.westGuide.geometry.dispose();
    guides.westGuide.geometry = new THREE.BufferGeometry().setFromPoints(westPts);
    guides.westGuide.computeLineDistances();

    const eastPts = [new THREE.Vector3(posX + halfW, 0.015, posZ), new THREE.Vector3(eastX, 0.015, posZ)];
    guides.eastGuide.geometry.dispose();
    guides.eastGuide.geometry = new THREE.BufferGeometry().setFromPoints(eastPts);
    guides.eastGuide.computeLineDistances();

    const northPts = [new THREE.Vector3(posX, 0.015, posZ - halfD), new THREE.Vector3(posX, 0.015, northZ)];
    guides.northGuide.geometry.dispose();
    guides.northGuide.geometry = new THREE.BufferGeometry().setFromPoints(northPts);
    guides.northGuide.computeLineDistances();

    const southPts = [new THREE.Vector3(posX, 0.015, posZ + halfD), new THREE.Vector3(posX, 0.015, southZ)];
    guides.southGuide.geometry.dispose();
    guides.southGuide.geometry = new THREE.BufferGeometry().setFromPoints(southPts);
    guides.southGuide.computeLineDistances();

    // Axis Guide
    if (axisLock === 'x') {
      p.axisGuide.group.visible = true;
      p.axisGuide.line.material = p.axisGuide.axisXMat;
      const xLinePts = [new THREE.Vector3(-roomW / 2, 0.02, posZ), new THREE.Vector3(roomW / 2, 0.02, posZ)];
      p.axisGuide.line.geometry.dispose();
      p.axisGuide.line.geometry = new THREE.BufferGeometry().setFromPoints(xLinePts);
    } else if (axisLock === 'z') {
      p.axisGuide.group.visible = true;
      p.axisGuide.line.material = p.axisGuide.axisZMat;
      const zLinePts = [new THREE.Vector3(posX, 0.02, -roomD / 2), new THREE.Vector3(posX, 0.02, roomD / 2)];
      p.axisGuide.line.geometry.dispose();
      p.axisGuide.line.geometry = new THREE.BufferGeometry().setFromPoints(zLinePts);
    } else {
      p.axisGuide.group.visible = false;
    }
  };

  const startGrab = (propId, isPointerDown = false) => {
    if (propId && propId.startsWith('struct-')) {
      const structMesh = structuralMeshesRef.current.get(propId);
      if (!structMesh) return;
      activeGrabRef.current = {
        isGrabbing: true,
        propId,
        isStructural: true,
        initialX: structMesh.position.x,
        initialY: structMesh.position.y,
        initialZ: structMesh.position.z,
        initialRot: structMesh.rotation.y,
        axisLock: null,
        liftY: 0.08,
        isPointerDown
      };
      structMesh.position.y += 0.08;
      setIsGrabbingProp(true);
      setGrabAxisLock(null);
      if (controlsRef.current) controlsRef.current.enabled = false;
      playSnap();
      return;
    }

    const record = physicsEngine.physicsObjects.get(propId);
    if (!record || !record.body) return;
    const t = record.body.translation();
    const r = record.body.rotation();

    activeGrabRef.current = {
      isGrabbing: true,
      propId,
      isStructural: false,
      initialX: t.x,
      initialY: t.y,
      initialZ: t.z,
      initialRot: { ...r },
      axisLock: null,
      liftY: 0.12,
      isPointerDown
    };

    record.body.setTranslation({ x: t.x, y: t.y + 0.12, z: t.z }, true);
    record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    record.body.wakeUp();

    setIsGrabbingProp(true);
    setGrabAxisLock(null);
    if (controlsRef.current) controlsRef.current.enabled = false;
    playSnap();
  };

  const settleGrab = (propId) => {
    if (activeGrabRef.current.isStructural) {
      const structMesh = structuralMeshesRef.current.get(propId);
      if (structMesh) {
        structMesh.position.y = activeGrabRef.current.initialY;
      }
      playThud();
      activeGrabRef.current.isGrabbing = false;
      activeGrabRef.current.isPointerDown = false;
      setIsGrabbingProp(false);
      setGrabAxisLock(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
      return;
    }

    const record = physicsEngine.physicsObjects.get(propId);
    if (!record || !record.body) return;
    const t = record.body.translation();
    const halfH = physicsEngine.getHalfHeight(record.type);
    const supportingY = physicsEngine.getSupportingSurfaceY(t.x, t.z, propId, record.type);
    const restingY = supportingY + halfH;

    physicsEngine.settleBody(propId, restingY);
    playThud();

    setSpawnedProps(prev =>
      prev.map(p => (p.id === propId ? { ...p, x: t.x, y: restingY, z: t.z } : p))
    );

    activeGrabRef.current.isGrabbing = false;
    activeGrabRef.current.isPointerDown = false;
    setIsGrabbingProp(false);
    setGrabAxisLock(null);
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  const cancelGrab = () => {
    if (!activeGrabRef.current.isGrabbing) return;
    const { propId, initialX, initialY, initialZ, initialRot, isStructural } = activeGrabRef.current;
    if (isStructural) {
      const structMesh = structuralMeshesRef.current.get(propId);
      if (structMesh) {
        structMesh.position.x = initialX;
        structMesh.position.y = initialY;
        structMesh.position.z = initialZ;
        structMesh.rotation.y = initialRot;
      }
      activeGrabRef.current.isGrabbing = false;
      activeGrabRef.current.isPointerDown = false;
      setIsGrabbingProp(false);
      setGrabAxisLock(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
      playChime(350);
      return;
    }

    const record = physicsEngine.physicsObjects.get(propId);
    if (record && record.body) {
      record.body.setTranslation({ x: initialX, y: initialY, z: initialZ }, true);
      if (initialRot) {
        record.body.setRotation(initialRot, true);
      }
      record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      record.body.wakeUp();
    }

    activeGrabRef.current.isGrabbing = false;
    activeGrabRef.current.isPointerDown = false;
    setIsGrabbingProp(false);
    setGrabAxisLock(null);
    if (controlsRef.current) controlsRef.current.enabled = true;
    playChime(350);
  };

  // Bind global helper functions
  window.__wolfGrabProp = (id) => startGrab(id);
  window.__wolfSettleProp = (id) => settleGrab(id);
  window.__wolfCancelGrab = () => cancelGrab();
  window.__wolfToggleAxisLock = (axis) => {
    if (!activeGrabRef.current.isGrabbing) return;
    const nextAxis = activeGrabRef.current.axisLock === axis ? null : axis;
    activeGrabRef.current.axisLock = nextAxis;
    setGrabAxisLock(nextAxis);
    playSnap();
  };
  window.__wolfUpdateFootprint = updateFootprintVisuals;
  window.__wolfMoveStructural = (id, dx, dz) => {
    const mesh = structuralMeshesRef.current.get(id);
    if (!mesh) return;
    mesh.position.x += dx;
    mesh.position.z += dz;
    playSnap();
  };
  window.__wolfRotateStructural = (id, angle) => {
    const mesh = structuralMeshesRef.current.get(id);
    if (!mesh) return;
    mesh.rotation.y += angle;
    playChime(740);
  };
  window.__wolfPanToPlanCoordinates = (x, z, camY = 16.0) => {
    if (!cameraRef.current || !controlsRef.current) return;
    gsap.to(cameraRef.current.position, {
      x,
      y: camY,
      z: z + 0.01,
      duration: 1.0,
      ease: 'power2.inOut'
    });
    gsap.to(controlsRef.current.target, {
      x,
      y: 0,
      z,
      duration: 1.0,
      ease: 'power2.inOut'
    });
  };

  // Procedural Textures Memo
  const textures = useMemo(() => ({
    sunset: createSunsetCanvas(),
    code: createCodeScreenCanvas(),
    art: createModernArtCanvas(),
    crate: createCrateWoodTexture(),
    terracottaTile: createTerracottaTileTexture(),
    cedarWood: createCedarWoodTexture(),
    travertine: createTravertineTexture(),
    linen: createLinenTexture(),
    limewashPlaster: createLimewashPlasterTexture(),
    plasterBump: createPlasterBumpMap(),
    flutedWood: createFlutedWoodTexture(),
    curtainWoven: createWovenLinenCurtainTexture()
  }), []);

  // Dedicated Architectural Furniture Materials
  const furnitureMaterials = useMemo(() => {
    return createFurnitureMaterials({
      cedar: textures.cedarWood,
      travertine: textures.travertine,
      linen: textures.linen,
      flutedWood: textures.flutedWood,
      curtain: textures.curtainWoven
    });
  }, [textures]);

  // Shared Materials
  const materials = useMemo(() => {
    return {
      floor: new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.55 }),
      floorPlinth: new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.8 }),
      wall: new THREE.MeshStandardMaterial({
        color: 0xf3ede3,
        map: textures.limewashPlaster,
        bumpMap: textures.plasterBump,
        bumpScale: 0.012,
        roughness: 0.88
      }),
      wallEdge: new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.8 }),
      partitionWall: new THREE.MeshStandardMaterial({
        color: 0xf0ebe1,
        map: textures.limewashPlaster,
        bumpMap: textures.plasterBump,
        bumpScale: 0.010,
        roughness: 0.86
      }),
      skirting: new THREE.MeshStandardMaterial({
        color: 0x362f29,
        roughness: 0.65
      }),
      flutedAccent: new THREE.MeshStandardMaterial({
        color: 0xaa784f,
        map: textures.flutedWood,
        roughness: 0.62
      }),
      doorWood: new THREE.MeshStandardMaterial({
        color: 0x7a5334,
        map: textures.cedarWood,
        roughness: 0.68
      }),
      oakLight: new THREE.MeshStandardMaterial({ color: 0xd6bda0, roughness: 0.6 }),
      oakDark: new THREE.MeshStandardMaterial({ color: 0x9e7b56, roughness: 0.7 }),
      cushionCream: new THREE.MeshStandardMaterial({ color: 0xede6db, roughness: 0.9 }),
      cushionTerracotta: new THREE.MeshStandardMaterial({ color: 0xb55a36, roughness: 0.85 }),
      cushionOlive: new THREE.MeshStandardMaterial({ color: 0x485842, roughness: 0.85 }),
      charcoalMetal: new THREE.MeshStandardMaterial({ color: 0x282624, roughness: 0.35, metalness: 0.7 }),
      warmLed: new THREE.MeshStandardMaterial({ color: 0xffa044, emissive: 0xffa044, emissiveIntensity: 2.2 }),
      projectorScreen: new THREE.MeshStandardMaterial({ map: textures.sunset, emissive: 0xffa055, emissiveMap: textures.sunset, emissiveIntensity: 0.75 }),
      computerScreen: new THREE.MeshStandardMaterial({ map: textures.code, emissive: 0x61afef, emissiveMap: textures.code, emissiveIntensity: 0.8 }),
      curtain: new THREE.MeshStandardMaterial({
        color: 0xfaf6f0,
        map: textures.curtainWoven,
        roughness: 0.95,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      }),
      kitchenStone: new THREE.MeshStandardMaterial({ color: 0x262524, roughness: 0.35 }),
      kitchenWhiteMarble: new THREE.MeshStandardMaterial({ color: 0xeeeae4, roughness: 0.3 }),
      bedLinen: new THREE.MeshStandardMaterial({ color: 0xf1ece4, roughness: 0.9 }),
      bedDuvet: new THREE.MeshStandardMaterial({ color: 0x3d3936, roughness: 0.85 }),
      plantLeaf: new THREE.MeshStandardMaterial({ color: 0x384a32, roughness: 0.6 }),
      potCeramic: new THREE.MeshStandardMaterial({ color: 0xcbc4b8, roughness: 0.6 }),
      crateWood: new THREE.MeshStandardMaterial({ map: textures.crate, roughness: 0.7 }),
      steelBox: new THREE.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.3, metalness: 0.85 }),
      carpetGrey: new THREE.MeshStandardMaterial({ color: 0xbfb8ae, roughness: 0.95 }),
      teakDeck: new THREE.MeshStandardMaterial({ color: 0x825433, roughness: 0.65 }),
      waterMesh: new THREE.MeshStandardMaterial({ color: 0x2ba5be, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.82 }),
      deckGlass: new THREE.MeshStandardMaterial({ color: 0xe0f2f7, roughness: 0.1, transparent: true, opacity: 0.45 }),
      fireplaceStone: new THREE.MeshStandardMaterial({ color: 0x1d1c1a, roughness: 0.4 }),
      brassFixture: new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.28, metalness: 0.85 }),
      shadowContact: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
    };
  }, [textures]);

  // Setup WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd7cfc4);
    scene.fog = new THREE.FogExp2(0xd7cfc4, 0.018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(16.5, 14.0, 15.2);
    cameraRef.current = camera;

    // WebGL Renderer with PCFShadowMap and Filmic ToneMapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Dynamic import OrbitControls
    let controls = null;
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0.5, 1.2, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.02;
      controls.minDistance = 3;
      controls.maxDistance = 35;
      controlsRef.current = controls;
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.15);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfff1dd, 2.2);
    sunLight.position.set(-10, 12, -4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Groups
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);
    houseGroupRef.current = houseGroup;

    const terraceGroup = new THREE.Group();
    scene.add(terraceGroup);
    terraceGroupRef.current = terraceGroup;

    const hotspotsGroup = new THREE.Group();
    scene.add(hotspotsGroup);
    hotspotsGroupRef.current = hotspotsGroup;

    const dimensionsGroup = new THREE.Group();
    scene.add(dimensionsGroup);
    dimensionsGroupRef.current = dimensionsGroup;

    const propsGroup = new THREE.Group();
    scene.add(propsGroup);
    propsGroupRef.current = propsGroup;

    const cadPresentationGroup = new THREE.Group();
    cadPresentationGroup.name = 'cadPresentationGroup';
    cadPresentationGroup.visible = false;
    scene.add(cadPresentationGroup);
    cadPresentationGroupRef.current = cadPresentationGroup;

    // Laser Measurements Group (Dynamic 1:1 Metric Dimension strings & markers)
    const measurementsGroup = new THREE.Group();
    measurementsGroup.name = 'measurementsGroup';
    scene.add(measurementsGroup);
    measurementsGroupRef.current = measurementsGroup;

    const activeMeasurePreview = new THREE.Group();
    activeMeasurePreview.name = 'activeMeasurePreview';
    activeMeasurePreview.visible = false;
    scene.add(activeMeasurePreview);
    activeMeasurePreviewRef.current = activeMeasurePreview;

    // Selection Ring Visual
    const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xdfb15b, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.02;
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // 3D Blender Architectural Placement & Footprint Projector System
    const placementProjectorGroup = new THREE.Group();
    placementProjectorGroup.name = 'placementProjectorGroup';
    placementProjectorGroup.visible = false;

    // A. Room Usable Interior Placement Zone (Floor Blueprint Grid)
    const roomBoundaryGrid = new THREE.Group();
    roomBoundaryGrid.name = 'roomBoundaryGrid';
    placementProjectorGroup.add(roomBoundaryGrid);

    // B. Object Footprint Projector Group
    const footprintGroup = new THREE.Group();
    footprintGroup.name = 'footprintGroup';
    footprintGroup.position.y = 0.015;

    // B1. Semi-transparent fill plane
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const footprintPlane = new THREE.Mesh(planeGeo, planeMat);
    footprintGroup.add(footprintPlane);

    // B2. Footprint perimeter box line
    const boxPts = [
      new THREE.Vector3(-0.5, 0.001, -0.5),
      new THREE.Vector3(0.5, 0.001, -0.5),
      new THREE.Vector3(0.5, 0.001, 0.5),
      new THREE.Vector3(-0.5, 0.001, 0.5),
      new THREE.Vector3(-0.5, 0.001, -0.5)
    ];
    const boxGeo = new THREE.BufferGeometry().setFromPoints(boxPts);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x00f5d4, linewidth: 2, transparent: true, opacity: 0.9 });
    const footprintOutline = new THREE.Line(boxGeo, boxMat);
    footprintGroup.add(footprintOutline);

    // B3. Center Crosshair
    const crossPts = [
      new THREE.Vector3(-0.16, 0.002, 0), new THREE.Vector3(0.16, 0.002, 0),
      new THREE.Vector3(0, 0.002, -0.16), new THREE.Vector3(0, 0.002, 0.16)
    ];
    const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPts);
    const crossMat = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    footprintGroup.add(crossMat);

    // B4. Forward Orientation Arrow
    const arrowPts = [
      new THREE.Vector3(0, 0.002, -0.2), new THREE.Vector3(0, 0.002, -0.48),
      new THREE.Vector3(-0.09, 0.002, -0.38), new THREE.Vector3(0, 0.002, -0.48),
      new THREE.Vector3(0.09, 0.002, -0.38)
    ];
    const arrowGeo = new THREE.BufferGeometry().setFromPoints(arrowPts);
    const arrowLine = new THREE.Line(arrowGeo, new THREE.LineBasicMaterial({ color: 0xdfb15b, transparent: true, opacity: 0.95 }));
    footprintGroup.add(arrowLine);

    // B5. 4 Corner L-Brackets (Blender CAD corner brackets)
    const cornersGroup = new THREE.Group();
    const cornerMat = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xdfb15b, linewidth: 2, transparent: true, opacity: 0.95 })
    );
    cornersGroup.add(cornerMat);
    footprintGroup.add(cornersGroup);

    // B6. Soft Contact Shadow
    const shadowGeo = new THREE.RingGeometry(0.02, 0.48, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.y = 0.004;
    footprintGroup.add(contactShadow);

    placementProjectorGroup.add(footprintGroup);

    // C. Wall Distance Guide Lines
    const wallGuidesGroup = new THREE.Group();
    wallGuidesGroup.name = 'wallGuidesGroup';
    const guideMat = new THREE.LineDashedMaterial({
      color: 0xdfb15b,
      dashSize: 0.25,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.75
    });
    const westGuide = new THREE.Line(new THREE.BufferGeometry(), guideMat);
    const eastGuide = new THREE.Line(new THREE.BufferGeometry(), guideMat);
    const northGuide = new THREE.Line(new THREE.BufferGeometry(), guideMat);
    const southGuide = new THREE.Line(new THREE.BufferGeometry(), guideMat);
    wallGuidesGroup.add(westGuide, eastGuide, northGuide, southGuide);
    placementProjectorGroup.add(wallGuidesGroup);

    // D. Axis Lock Guide Line
    const axisLockGuideGroup = new THREE.Group();
    axisLockGuideGroup.name = 'axisLockGuideGroup';
    axisLockGuideGroup.visible = false;
    const axisXMat = new THREE.LineBasicMaterial({ color: 0xff3b30, linewidth: 3, transparent: true, opacity: 0.9 });
    const axisZMat = new THREE.LineBasicMaterial({ color: 0x007aff, linewidth: 3, transparent: true, opacity: 0.9 });
    const axisLine = new THREE.Line(new THREE.BufferGeometry(), axisXMat);
    axisLockGuideGroup.add(axisLine);
    placementProjectorGroup.add(axisLockGuideGroup);

    scene.add(placementProjectorGroup);
    placementProjectorRef.current = {
      group: placementProjectorGroup,
      roomGrid: roomBoundaryGrid,
      footprint: footprintGroup,
      plane: footprintPlane,
      planeMat,
      outline: footprintOutline,
      boxMat,
      arrow: arrowLine,
      cross: crossMat,
      cornerMat,
      contactShadow,
      wallGuides: { westGuide, eastGuide, northGuide, southGuide },
      axisGuide: { group: axisLockGuideGroup, line: axisLine, axisXMat, axisZMat }
    };

    const updateRoomBoundaryGrid = (roomW, roomD) => {
      if (!placementProjectorRef.current) return;
      const gridGroup = placementProjectorRef.current.roomGrid;
      while (gridGroup.children.length > 0) {
        const c = gridGroup.children.pop();
        if (c.geometry) c.geometry.dispose();
      }

      const margin = 0.40;
      const minX = -roomW / 2 + margin;
      const maxX = roomW / 2 - margin;
      const minZ = -roomD / 2 + margin;
      const maxZ = roomD / 2 - margin;
      const y = 0.008;

      const borderPts = [
        new THREE.Vector3(minX, y, minZ),
        new THREE.Vector3(maxX, y, minZ),
        new THREE.Vector3(maxX, y, maxZ),
        new THREE.Vector3(minX, y, maxZ),
        new THREE.Vector3(minX, y, minZ)
      ];
      const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
      const borderMat = new THREE.LineDashedMaterial({
        color: 0xdfb15b,
        dashSize: 0.35,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.65
      });
      const borderLine = new THREE.Line(borderGeo, borderMat);
      borderLine.computeLineDistances();
      gridGroup.add(borderLine);

      const gridPts = [];
      for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1.0) {
        gridPts.push(new THREE.Vector3(x, y - 0.002, minZ), new THREE.Vector3(x, y - 0.002, maxZ));
      }
      for (let z = Math.ceil(minZ); z <= Math.floor(maxZ); z += 1.0) {
        gridPts.push(new THREE.Vector3(minX, y - 0.002, z), new THREE.Vector3(maxX, y - 0.002, z));
      }
      if (gridPts.length > 0) {
        const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPts);
        const gridMat = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({
          color: 0xdfb15b,
          transparent: true,
          opacity: 0.16
        }));
        gridGroup.add(gridMat);
      }
    };
    window.__wolfUpdatePlacementGrid = updateRoomBoundaryGrid;
    updateRoomBoundaryGrid(roomDimensions.width, roomDimensions.depth);

    // Initialize Rapier Physics & auto-stage Mediterranean suite if room is clean
    physicsEngine.init(roomDimensions.width, roomDimensions.depth, roomDimensions.height).then(() => {
      physicsEngine.updateBoundaries(roomDimensions.width, roomDimensions.depth, roomDimensions.height);
      setSpawnedProps(prev => {
        if (prev.length === 0) {
          const staged = INITIAL_MEDITERRANEAN_PROPS.map(p => {
            physicsEngine.createBody(p.id, p.type, p.x, p.y, p.z);
            return { ...p };
          });
          return staged;
        } else {
          prev.forEach(p => {
            if (!physicsEngine.physicsObjects.has(p.id)) {
              physicsEngine.createBody(p.id, p.type, p.x, p.y, p.z);
            }
          });
          return prev;
        }
      });
    });

    // Expose drawer animator for ItemTransformHud and UI
    window.__wolfToggleDrawers = (propId) => {
      if (!propsGroupRef.current) return false;
      const target = propsGroupRef.current.children.find(c => c.userData.propId === propId);
      if (target && target.userData && target.userData.toggleDrawers) {
        return target.userData.toggleDrawers();
      }
      return false;
    };

    // Expose door navigation and occupant commands
    window.__wolfSendOccupantToRoom = (roomId) => avatarManager.sendAllToRoom(roomId);

    // Initialize 3D Navigation Topology and Occupant Avatars
    navigationEngine.setPlan(housePlan, roomDimensions);
    avatarManager.init(scene);
    avatarManager.onPlanChanged(housePlan, roomDimensions);

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard handlers for Walk mode and transform shortcuts
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') walkKeysRef.current.forward = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') walkKeysRef.current.backward = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') walkKeysRef.current.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') walkKeysRef.current.right = true;

      // Shortcut: P to toggle Studio / Presentation
      if (e.key === 'p' || e.key === 'P') {
        setAppMode(prev => prev === 'studio' ? 'presentation' : 'studio');
      }

      // Shortcut: M to toggle 1:1 Metric Laser Tape Measure Tool
      if (e.key === 'm' || e.key === 'M') {
        const next = !isMeasureToolActiveRef.current;
        setIsMeasureToolActive(next);
        if (!next) {
          measureStartPointRef.current = null;
          if (activeMeasurePreviewRef.current) activeMeasurePreviewRef.current.visible = false;
        }
        playChime(next ? 720 : 420);
      }

      // Blender-style Transform Shortcuts
      const curSelectedId = selectedPropIdRef.current;
      if (appModeRef.current === 'studio' && cameraViewRef.current !== 'walk') {
        // 'G': Grab / Move
        if ((e.key === 'g' || e.key === 'G') && curSelectedId) {
          if (activeGrabRef.current.isGrabbing) {
            settleGrab(curSelectedId);
          } else {
            startGrab(curSelectedId);
          }
        }

        // 'R': Rotate 45°
        if ((e.key === 'r' || e.key === 'R') && curSelectedId) {
          const record = physicsEngine.physicsObjects.get(curSelectedId);
          if (record && record.body) {
            const curRot = record.body.rotation();
            const curQ = new THREE.Quaternion(curRot.x, curRot.y, curRot.z, curRot.w);
            const rotStep = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
            curQ.multiply(rotStep);
            record.body.setRotation({ x: curQ.x, y: curQ.y, z: curQ.z, w: curQ.w }, true);
            record.body.wakeUp();
            playChime(740);
          }
        }

        // 'X': Toggle X-axis lock while grabbing
        if ((e.key === 'x' || e.key === 'X') && activeGrabRef.current.isGrabbing) {
          const next = activeGrabRef.current.axisLock === 'x' ? null : 'x';
          activeGrabRef.current.axisLock = next;
          setGrabAxisLock(next);
          playSnap();
        }

        // 'Z': Toggle Z-axis lock while grabbing
        if ((e.key === 'z' || e.key === 'Z') && activeGrabRef.current.isGrabbing) {
          const next = activeGrabRef.current.axisLock === 'z' ? null : 'z';
          activeGrabRef.current.axisLock = next;
          setGrabAxisLock(next);
          playSnap();
        }

        // 'S': Settle firmly to floor/surface
        if ((e.key === 's' || e.key === 'S') && curSelectedId && !e.ctrlKey && !e.metaKey) {
          settleGrab(curSelectedId);
        }

        // 'Enter' or 'Space': Settle down when grabbing
        if ((e.key === 'Enter' || e.code === 'Space') && activeGrabRef.current.isGrabbing && curSelectedId) {
          e.preventDefault();
          settleGrab(curSelectedId);
        }

        // 'Escape': Cancel measurement, grab, or deselect
        if (e.key === 'Escape') {
          if (measureStartPointRef.current) {
            measureStartPointRef.current = null;
            if (activeMeasurePreviewRef.current) activeMeasurePreviewRef.current.visible = false;
            playSnap();
          } else if (activeGrabRef.current.isGrabbing) {
            e.preventDefault();
            cancelGrab();
          } else {
            setSelectedPropId(null);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') walkKeysRef.current.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') walkKeysRef.current.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') walkKeysRef.current.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') walkKeysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let animId = null;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const time = now / 1000;

      // Step physics
      physicsEngine.step();

      const curSelectedId = selectedPropIdRef.current;

      // Sync physics bodies with prop meshes
      propsGroup.children.forEach(mesh => {
        const id = mesh.userData.propId;
        const record = physicsEngine.physicsObjects.get(id);
        if (record && record.body) {
          const t = record.body.translation();
          const r = record.body.rotation();
          mesh.position.set(t.x, t.y, t.z);
          mesh.quaternion.set(r.x, r.y, r.z, r.w);

          // Update selection ring & footprint projector if this prop is selected
          if (mesh.userData.propId === curSelectedId) {
            if (selectionRingRef.current) {
              selectionRingRef.current.position.set(t.x, 0.02, t.z);
            }
            if (window.__wolfUpdateFootprint && !activeGrabRef.current.isGrabbing) {
              window.__wolfUpdateFootprint(curSelectedId, t.x, t.z, new THREE.Quaternion(r.x, r.y, r.z, r.w), false, null);
            }
          }
        }
      });

      if (!curSelectedId && placementProjectorRef.current) {
        placementProjectorRef.current.group.visible = false;
      }

      // Animate Hotspot Rings
      if (hotspotsGroup.visible) {
        hotspotsGroup.children.forEach((beacon, i) => {
          const inner = beacon.getObjectByName('innerRing');
          const outer = beacon.getObjectByName('outerRing');
          if (inner) {
            const s = 1.0 + Math.sin(time * 3 + i) * 0.12;
            inner.scale.set(s, s, 1);
          }
          if (outer) {
            const s = 1.0 + Math.sin(time * 2 + i * 1.5) * 0.18;
            outer.scale.set(s, s, 1);
          }
        });
      }

      // Update Autonomous 3D Avatars (Kinematic walk cycle, door crossing, path ribbons)
      avatarManager.update(delta);

      // First-person Walk Controls with Wall & Door Collisions
      if (cameraViewRef.current === 'walk' && cameraRef.current) {
        const cam = cameraRef.current;
        window.__wolfCamera = cam;
        const moveSpeed = 4.2 * delta;
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        const moveDelta = new THREE.Vector3();

        if (walkKeysRef.current.forward) moveDelta.addScaledVector(dir, moveSpeed);
        if (walkKeysRef.current.backward) moveDelta.addScaledVector(dir, -moveSpeed);
        if (walkKeysRef.current.left) moveDelta.addScaledVector(side, -moveSpeed);
        if (walkKeysRef.current.right) moveDelta.addScaledVector(side, moveSpeed);

        const isMoving = moveDelta.lengthSq() > 0.00001;
        if (isMoving) {
          const { width: rw, depth: rd } = roomDimensionsRef.current;
          const minX = -rw / 2 + 0.6;
          const maxX = rw / 2 - 0.6;
          const minZ = -rd / 2 + 0.6;
          const maxZ = showOutdoorTerraceRef.current ? (rd / 2 + 4.0) : (rd / 2 - 0.6);

          const proposedPos = new THREE.Vector3(
            THREE.MathUtils.clamp(cam.position.x + moveDelta.x, minX, maxX),
            cam.position.y,
            THREE.MathUtils.clamp(cam.position.z + moveDelta.z, minZ, maxZ)
          );

          // Spatial Wall, Furniture & Occupant Collision Resolution:
          // Prevents walking through solid walls, glass windows, furniture, and occupants ("babe"),
          // while smoothly permitting passage through open doorway portals!
          const dynamicColliders = [];
          for (const [id, record] of physicsEngine.physicsObjects.entries()) {
            if (!record.body) continue;
            const t = record.body.translation();
            const dim = physicsEngine.getDimensions(record.type);
            if (t.y < 1.1) {
              dynamicColliders.push({
                x: t.x,
                z: t.z,
                hx: dim.width / 2,
                hz: dim.depth / 2,
                type: 'furniture',
                label: record.type
              });
            }
          }

          if (avatarManager && avatarManager.agents) {
            for (const agent of avatarManager.agents) {
              if (agent.root && agent.root.visible) {
                dynamicColliders.push({
                  x: agent.root.position.x,
                  z: agent.root.position.z,
                  hx: 0.30,
                  hz: 0.30,
                  type: 'avatar',
                  label: agent.name
                });
              }
            }
          }

          const colResult = navigationEngine.resolveWallCollision(cam.position, proposedPos, 0.35, dynamicColliders);
          cam.position.x = colResult.pos.x;
          cam.position.z = colResult.pos.z;

          // Footstep audio cadence
          walkStepTimerRef.current += delta;
          if (walkStepTimerRef.current > 0.42) {
            walkStepTimerRef.current = 0;
            playFootstep('wood');
          }

          // Subtle head-bob
          walkBobPhaseRef.current += delta * 8.5;
          cam.position.y = 1.65 + Math.sin(walkBobPhaseRef.current) * 0.035;
        } else {
          cam.position.y = THREE.MathUtils.lerp(cam.position.y, 1.65, 0.1);
        }
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Shimmer Water & Flicker Fireplace
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = -0.06 + Math.sin(time * 2.4) * 0.003;
      }
      if (fireLightRef.current && isLightFixturesOn) {
        fireLightRef.current.intensity = 1.6 + Math.sin(time * 14) * 0.3 + Math.cos(time * 26) * 0.2;
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, []);

  // Update App Mode effects
  useEffect(() => {
    document.body.className = appMode === 'presentation' ? 'mode-presentation' : 'mode-studio';
    if (hotspotsGroupRef.current) {
      hotspotsGroupRef.current.visible = appMode === 'presentation';
    }
    if (dimensionsGroupRef.current) {
      dimensionsGroupRef.current.visible = showDimensions && appMode === 'studio';
    }
    if (selectionRingRef.current) {
      selectionRingRef.current.visible = appMode === 'studio' && !!selectedPropId;
    }
  }, [appMode, showDimensions, selectedPropId]);

  // Synchronize 1:1 Metric Laser Tape Measurements into 3D Scene
  useEffect(() => {
    const grp = measurementsGroupRef.current;
    if (!grp) return;

    while (grp.children.length > 0) {
      const c = grp.children.pop();
      if (c.geometry) c.geometry.dispose();
      if (c.material && c.material.dispose) c.material.dispose();
    }

    laserMeasurements.forEach(m => {
      const p1 = new THREE.Vector3(...m.p1);
      const p2 = new THREE.Vector3(...m.p2);

      // Neon cyan laser tape line
      const pts = [new THREE.Vector3(p1.x, p1.y + 0.04, p1.z), new THREE.Vector3(p2.x, p2.y + 0.04, p2.z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f5d4,
        linewidth: 2,
        transparent: true,
        opacity: 0.95
      });
      const line = new THREE.Line(lineGeo, lineMat);
      grp.add(line);

      // End point spherical pins
      const pinGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
      const pinA = new THREE.Mesh(pinGeo, pinMat);
      pinA.position.set(p1.x, p1.y + 0.04, p1.z);
      const pinB = new THREE.Mesh(pinGeo, pinMat);
      pinB.position.set(p2.x, p2.y + 0.04, p2.z);
      grp.add(pinA);
      grp.add(pinB);

      // Midpoint measurement badge
      const mid = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 0.28, (p1.z + p2.z) / 2);
      const badgeTex = createLaserMeasureBadgeTexture(m.label || `${m.dist} m`);
      const spriteMat = new THREE.SpriteMaterial({ map: badgeTex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(mid);
      sprite.scale.set(1.4, 0.35, 1);
      grp.add(sprite);
    });
  }, [laserMeasurements]);

  // Apply Architectural Style
  useEffect(() => {
    const s = STYLES[styleTheme];
    if (!s || !sceneRef.current) return;

    if (styleTheme === 'mediterranean') {
      materials.floor.map = textures.terracottaTile;
      materials.floor.roughness = 0.68;
    } else {
      materials.floor.map = null;
      materials.floor.roughness = 0.55;
    }
    materials.floor.needsUpdate = true;

    gsap.to(materials.floor.color, { ...new THREE.Color(s.floorColor), duration: 0.8 });
    gsap.to(materials.wall.color, { ...new THREE.Color(s.wallColor), duration: 0.8 });
    gsap.to(materials.partitionWall.color, { ...new THREE.Color(s.wallColor), duration: 0.8 });
    gsap.to(materials.oakLight.color, { ...new THREE.Color(s.woodColor), duration: 0.8 });
    gsap.to(materials.cushionCream.color, { ...new THREE.Color(s.cushionColor), duration: 0.8 });
    gsap.to(materials.curtain.color, { ...new THREE.Color(s.curtainColor), duration: 0.8 });
    materials.curtain.opacity = s.curtainOpacity;

    if (sunLightRef.current) {
      gsap.to(sunLightRef.current.color, { ...new THREE.Color(s.sunColor), duration: 0.8 });
      gsap.to(sunLightRef.current, { intensity: s.sunIntensity, duration: 0.8 });
    }
    sceneRef.current.background.set(s.bg);
    sceneRef.current.fog.color.set(s.bg);
  }, [styleTheme, materials, textures]);

  // Apply Atmospheric Mood
  useEffect(() => {
    const m = ATMOSPHERE_MOODS[atmosphereMood];
    if (!m || !sceneRef.current || !sunLightRef.current || !ambientLightRef.current) return;

    gsap.to(sunLightRef.current.color, { ...new THREE.Color(m.sunColor), duration: 1.2 });
    gsap.to(sunLightRef.current, { intensity: m.sunIntensity, duration: 1.2 });
    gsap.to(sunLightRef.current.position, { x: m.sunPos[0], y: m.sunPos[1], z: m.sunPos[2], duration: 1.4 });

    gsap.to(ambientLightRef.current.color, { ...new THREE.Color(m.ambientColor), duration: 1.2 });
    gsap.to(ambientLightRef.current, { intensity: m.ambientIntensity, duration: 1.2 });

    materials.warmLed.emissiveIntensity = m.ledIntensity;
    if (rendererRef.current) rendererRef.current.toneMappingExposure = m.exposure;

    sceneRef.current.background.set(m.bg);
    sceneRef.current.fog.color.set(m.bg);
  }, [atmosphereMood, materials]);

  // Apply Curtain Variant
  useEffect(() => {
    if (curtainState === 'velvet') {
      materials.curtain.opacity = 0.98;
      materials.curtain.color.set(0x3a332d);
    } else if (curtainState === 'shoji') {
      materials.curtain.opacity = 0.88;
      materials.curtain.color.set(0xf9f5ee);
    } else {
      // sheer
      materials.curtain.opacity = 0.8;
      materials.curtain.color.set(0xf5f1eb);
    }
  }, [curtainState, materials]);

  // Apply Warm Light Fixtures Toggle
  useEffect(() => {
    if (fireLightRef.current) {
      gsap.to(fireLightRef.current, { intensity: isLightFixturesOn ? 1.8 : 0.0, duration: 0.5 });
    }
    if (diningLightRef.current) {
      gsap.to(diningLightRef.current, { intensity: isLightFixturesOn ? 1.7 : 0.0, duration: 0.5 });
    }
    materials.warmLed.emissiveIntensity = isLightFixturesOn ? 2.4 : 0.15;
  }, [isLightFixturesOn, materials]);

  // Apply Outdoor Terrace Visibility
  useEffect(() => {
    if (terraceGroupRef.current) {
      terraceGroupRef.current.visible = showOutdoorTerrace;
    }
  }, [showOutdoorTerrace]);

  // Circadian Animation for Studio Joinery
  useEffect(() => {
    if (housePlan !== 'studio') return;
    const mp = murphyPivotRef.current;
    const df = deskFoldRef.current;
    const cg = chairGroupRef.current;
    const sp = slidingDoorRef.current;
    const dl = diningLeafRef.current;
    const ps = projScreenRef.current;
    const pg = projLightRef.current;
    const br = bedLightRef.current;

    if (!mp || !df) return;

    if (circadianModeIndex === 0) {
      // 01 Work
      gsap.to(mp.rotation, { x: 0, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(df.rotation, { x: 0, duration: 1.0, ease: 'back.out(1.4)' });
      materials.computerScreen.emissiveIntensity = 0.85;
      if (cg) gsap.to(cg.position, { x: 2.2, z: 0.75, duration: 1.3 });
      if (sp) gsap.to(sp.position, { x: 0, duration: 1.0 });
      if (dl) gsap.to(dl.scale, { x: 0.001, z: 0.001, duration: 0.8 });
      if (ps) ps.visible = false;
      if (pg) gsap.to(pg, { intensity: 0, duration: 0.8 });
      if (br) gsap.to(br, { intensity: 0, duration: 0.8 });
    } else if (circadianModeIndex === 1) {
      // 02 Cook
      gsap.to(df.rotation, { x: -Math.PI / 2, duration: 0.9 });
      gsap.to(mp.rotation, { x: 0, duration: 1.0 });
      materials.computerScreen.emissiveIntensity = 0.0;
      if (sp) gsap.to(sp.position, { x: -1.45, duration: 1.3 });
      if (dl) gsap.to(dl.scale, { x: 1, z: 1, duration: 1.1, delay: 0.3 });
      if (cg) gsap.to(cg.position, { x: 0.2, z: 0.7, duration: 1.2 });
      if (ps) ps.visible = false;
      if (pg) gsap.to(pg, { intensity: 0, duration: 0.8 });
      if (br) gsap.to(br, { intensity: 0, duration: 0.8 });
    } else if (circadianModeIndex === 2) {
      // 03 Entertain
      gsap.to(mp.rotation, { x: 0, duration: 1.0 });
      gsap.to(df.rotation, { x: -Math.PI / 2, duration: 0.8 });
      materials.computerScreen.emissiveIntensity = 0.0;
      if (sp) gsap.to(sp.position, { x: 0, duration: 1.0 });
      if (dl) gsap.to(dl.scale, { x: 0.001, z: 0.001, duration: 0.8 });
      if (ps) {
        ps.visible = true;
        gsap.to(ps.scale, { y: 1.0, duration: 1.4, ease: 'power2.out', delay: 0.2 });
      }
      if (pg) gsap.to(pg, { intensity: 2.1, duration: 1.5 });
      if (br) gsap.to(br, { intensity: 0, duration: 0.8 });
    } else if (circadianModeIndex === 3) {
      // 04 Sleep
      gsap.to(df.rotation, { x: -Math.PI / 2, duration: 0.8 });
      if (ps) {
        gsap.to(ps.scale, { y: 0.001, duration: 0.8 });
        setTimeout(() => { if (ps) ps.visible = false; }, 800);
      }
      if (pg) gsap.to(pg, { intensity: 0, duration: 0.8 });
      gsap.to(mp.rotation, { x: Math.PI / 2, duration: 1.5, delay: 0.3 });
      if (br) gsap.to(br, { intensity: 1.9, duration: 1.5, delay: 0.6 });
    }
  }, [circadianModeIndex, housePlan, materials]);

  // Build House Plan Architecture & Colliders
  useEffect(() => {
    const houseGroup = houseGroupRef.current;
    if (!houseGroup) return;

    // Clear old house meshes
    structuralMeshesRef.current.clear();
    while (houseGroup.children.length > 0) {
      const child = houseGroup.children[0];
      houseGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const { width: w, depth: d, height: h } = roomDimensions;
    const activePartitions = [];

    // Helper: Build Villa
    if (housePlan === 'villa') {
      // 1. Foundation & Floor
      const floorGroup = new THREE.Group();
      floorGroup.userData = { propId: 'struct-floor', name: 'Foundation & Floor Slab', isStructural: true };

      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
      floorMesh.position.set(0, -0.1, 0);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { propId: 'struct-floor', rootProp: floorGroup, isStructural: true };
      floorGroup.add(floorMesh);

      const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.4, d + 0.2), materials.floorPlinth);
      plinthMesh.position.set(0, -0.38, 0);
      plinthMesh.userData = { propId: 'struct-floor', rootProp: floorGroup, isStructural: true };
      floorGroup.add(plinthMesh);

      houseGroup.add(floorGroup);
      structuralMeshesRef.current.set('struct-floor', floorGroup);

      // 2. Exterior Perimeter Walls (Real Architectural Limewash Plaster & Skirting)
      const backWallGroup = new THREE.Group();
      backWallGroup.userData = { propId: 'struct-wall-back', name: 'Exterior Back Limewash Wall', isStructural: true };

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
      backWall.position.set(0, h / 2, -d / 2 - 0.1);
      backWall.receiveShadow = true;
      backWall.userData = { propId: 'struct-wall-back', rootProp: backWallGroup, isStructural: true };
      backWallGroup.add(backWall);

      const backWallCap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.24), materials.wallEdge);
      backWallCap.position.set(0, h + 0.04, -d / 2 - 0.1);
      backWallCap.userData = { propId: 'struct-wall-back', rootProp: backWallGroup, isStructural: true };
      backWallGroup.add(backWallCap);

      // Architectural Baseboard Skirting along back wall
      const backSkirting = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.025), materials.skirting);
      backSkirting.position.set(0, 0.06, -d / 2 + 0.0125);
      backSkirting.userData = { propId: 'struct-wall-back', rootProp: backWallGroup, isStructural: true };
      backWallGroup.add(backSkirting);

      // Architectural Negative Shadow Reveal at ceiling junction
      const backReveal = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.21), materials.wallEdge);
      backReveal.position.set(0, h - 0.015, -d / 2 - 0.1);
      backReveal.userData = { propId: 'struct-wall-back', rootProp: backWallGroup, isStructural: true };
      backWallGroup.add(backReveal);

      houseGroup.add(backWallGroup);
      structuralMeshesRef.current.set('struct-wall-back', backWallGroup);

      const leftWallGroup = new THREE.Group();
      leftWallGroup.userData = { propId: 'struct-wall-left', name: 'Exterior Left Picture Window Wall', isStructural: true };

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
      leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
      leftWall.receiveShadow = true;
      leftWall.userData = { propId: 'struct-wall-left', rootProp: leftWallGroup, isStructural: true };
      leftWallGroup.add(leftWall);

      const leftWallCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, d), materials.wallEdge);
      leftWallCap.position.set(-w / 2 - 0.1, h + 0.04, 0);
      leftWallCap.userData = { propId: 'struct-wall-left', rootProp: leftWallGroup, isStructural: true };
      leftWallGroup.add(leftWallCap);

      const leftSkirting = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, d), materials.skirting);
      leftSkirting.position.set(-w / 2 + 0.0125, 0.06, 0);
      leftSkirting.userData = { propId: 'struct-wall-left', rootProp: leftWallGroup, isStructural: true };
      leftWallGroup.add(leftSkirting);

      const leftReveal = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.03, d), materials.wallEdge);
      leftReveal.position.set(-w / 2 - 0.1, h - 0.015, 0);
      leftReveal.userData = { propId: 'struct-wall-left', rootProp: leftWallGroup, isStructural: true };
      leftWallGroup.add(leftReveal);

      houseGroup.add(leftWallGroup);
      structuralMeshesRef.current.set('struct-wall-left', leftWallGroup);

      // Real Architectural Multi-Pane Picture Window Frame, Sill & Mullions
      const winX = -w / 2 + 0.02;
      const winY = 1.8;
      const winZ = -1.0;
      const winW = 3.65;
      const winH = 2.40;

      // Anodized Aluminum Outer Casing Frame
      const winOuterFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, winH + 0.08, winW + 0.08), materials.charcoalMetal);
      winOuterFrame.position.set(winX, winY, winZ);
      winOuterFrame.userData = { propId: 'struct-window-main', name: 'Architectural Picture Window Frame', isStructural: true };
      houseGroup.add(winOuterFrame);
      structuralMeshesRef.current.set('struct-window-main', winOuterFrame);

      // Projecting Architectural Travertine Stone Window Sill
      const winSill = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, winW + 0.22), materials.travertineStone || materials.floor);
      winSill.position.set(winX + 0.06, winY - winH / 2 - 0.03, winZ);
      winSill.castShadow = true;
      houseGroup.add(winSill);

      // Vertical Center Mullion
      const winMullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, winH, 0.05), materials.charcoalMetal);
      winMullion.position.set(winX + 0.01, winY, winZ);
      houseGroup.add(winMullion);

      // Horizontal Transom Bar
      const winTransom = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, winW), materials.charcoalMetal);
      winTransom.position.set(winX + 0.01, winY + winH * 0.25, winZ);
      houseGroup.add(winTransom);

      // Double-Glazed Insulated Glass Pane
      const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, winH - 0.04, winW - 0.04), materials.deckGlass);
      winGlass.position.set(winX, winY, winZ);
      houseGroup.add(winGlass);

      // Real Architectural Ripplefold Curtains with Antique Brass Rod & Undulating Wave Folds
      const leftCurtains = buildArchitecturalCurtains(
        { width: 3.75, height: 2.90 },
        { ...furnitureMaterials, curtain: materials.curtain }
      );
      leftCurtains.rotation.y = Math.PI / 2;
      leftCurtains.position.set(-w / 2 + 0.16, 1.45, -1.0);
      houseGroup.add(leftCurtains);

      // Partitions with Skirting, Doorways & Open Architectural Doors
      const partA_len = 2.6;
      const partA_z = -3.9 + partA_len / 2;
      const partA = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partA_len), materials.partitionWall);
      partA.position.set(0, h / 2, partA_z);
      partA.castShadow = true;
      partA.receiveShadow = true;
      partA.userData = { propId: 'struct-partition-main', name: 'Interior Suite Dividing Partition Wall', isStructural: true };
      houseGroup.add(partA);
      structuralMeshesRef.current.set('struct-partition-main', partA);
      activePartitions.push({ x: 0, y: h / 2, z: partA_z, hx: 0.1, hy: h / 2, hz: partA_len / 2 });

      // Skirting on both faces of Part A
      [-0.1125, 0.1125].forEach(sx => {
        const sk = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, partA_len), materials.skirting);
        sk.position.set(sx, 0.06, partA_z);
        houseGroup.add(sk);
      });

      // Lintel 1 above Doorway 1
      const lintel1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h - 2.2, 1.1), materials.partitionWall);
      lintel1.position.set(0, 2.2 + (h - 2.2) / 2, -0.75);
      houseGroup.add(lintel1);

      // Doorway 1 Architectural Solid Cedar Jambs & Architrave
      const d1LeftJamb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.2, 0.05), materials.doorWood);
      d1LeftJamb.position.set(0, 1.1, -1.28);
      houseGroup.add(d1LeftJamb);

      const d1RightJamb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.2, 0.05), materials.doorWood);
      d1RightJamb.position.set(0, 1.1, -0.22);
      houseGroup.add(d1RightJamb);

      const d1HeaderCasing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 1.15), materials.doorWood);
      d1HeaderCasing.position.set(0, 2.22, -0.75);
      houseGroup.add(d1HeaderCasing);

      // Welcoming Solid Wood Panel Door Set Ajar into Suite (40° Open)
      const door1Group = new THREE.Group();
      door1Group.position.set(-0.06, 0, -1.26); // Hinge pivot at left jamb
      door1Group.rotation.y = 0.70; // 40 degrees ajar
      houseGroup.add(door1Group);

      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.16, 0.96), materials.doorWood);
      doorLeaf.position.set(0, 1.08, 0.48);
      doorLeaf.castShadow = true;
      door1Group.add(doorLeaf);

      // Recessed bevel panels on door face
      [-0.18, 0.18].forEach(pz => {
        const panUpper = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.78, 0.38), materials.rusticCedar || materials.doorWood);
        panUpper.position.set(0, 1.45, 0.48 + pz);
        door1Group.add(panUpper);

        const panLower = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.65, 0.38), materials.rusticCedar || materials.doorWood);
        panLower.position.set(0, 0.58, 0.48 + pz);
        door1Group.add(panLower);
      });

      // Antique Brass Lever Handle & Backplate on Door
      const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.05), materials.antiqueBrass);
      handlePlate.position.set(0, 1.05, 0.88);
      door1Group.add(handlePlate);

      const handleLever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12), materials.antiqueBrass);
      handleLever.rotation.x = Math.PI / 2;
      handleLever.position.set(0.04, 1.08, 0.88);
      door1Group.add(handleLever);

      // Partition B
      const partB_len = 2.2;
      const partB_z = -0.2 + partB_len / 2;
      const partB = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partB_len), materials.partitionWall);
      partB.position.set(0, h / 2, partB_z);
      partB.castShadow = true;
      partB.receiveShadow = true;
      houseGroup.add(partB);
      activePartitions.push({ x: 0, y: h / 2, z: partB_z, hx: 0.1, hy: h / 2, hz: partB_len / 2 });

      [-0.1125, 0.1125].forEach(sx => {
        const sk = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, partB_len), materials.skirting);
        sk.position.set(sx, 0.06, partB_z);
        houseGroup.add(sk);
      });

      // Lintel 2 & Architrave above Doorway 2
      const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h - 2.2, 1.1), materials.partitionWall);
      lintel2.position.set(0, 2.2 + (h - 2.2) / 2, 2.55);
      houseGroup.add(lintel2);

      const d2HeaderCasing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 1.15), materials.doorWood);
      d2HeaderCasing.position.set(0, 2.22, 2.55);
      houseGroup.add(d2HeaderCasing);

      // Partition C
      const partC_len = 0.8;
      const partC_z = 3.1 + partC_len / 2;
      const partC = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, partC_len), materials.partitionWall);
      partC.position.set(0, h / 2, partC_z);
      partC.castShadow = true;
      partC.receiveShadow = true;
      houseGroup.add(partC);
      activePartitions.push({ x: 0, y: h / 2, z: partC_z, hx: 0.1, hy: h / 2, hz: partC_len / 2 });

      [-0.1125, 0.1125].forEach(sx => {
        const sk = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, partC_len), materials.skirting);
        sk.position.set(sx, 0.06, partC_z);
        houseGroup.add(sk);
      });

      // Cross Partition (Dividing Kitchen and Suite)
      const partCross_len = 4.2;
      const partCross_x = partCross_len / 2;
      const partCross = new THREE.Mesh(new THREE.BoxGeometry(partCross_len, h, 0.2), materials.partitionWall);
      partCross.position.set(partCross_x, h / 2, 0);
      partCross.castShadow = true;
      partCross.receiveShadow = true;
      houseGroup.add(partCross);
      activePartitions.push({ x: partCross_x, y: h / 2, z: 0, hx: partCross_len / 2, hy: h / 2, hz: 0.1 });

      [-0.1125, 0.1125].forEach(sz => {
        const sk = new THREE.Mesh(new THREE.BoxGeometry(partCross_len, 0.12, 0.025), materials.skirting);
        sk.position.set(partCross_x, 0.06, sz);
        houseGroup.add(sk);
      });

      // Architectural Bi-Directional Wall Sconces (Warm Grazing Lights)
      const sconcePositions = [
        [-4.5, 2.1, -d / 2 + 0.03, 0],
        [-1.1, 2.1, -d / 2 + 0.03, 0],
        [-0.13, 2.1, 0.9, -Math.PI / 2],
        [4.2, 2.1, -d / 2 + 0.03, 0]
      ];
      sconcePositions.forEach(([sx, sy, sz, sRot]) => {
        const sconceGroup = new THREE.Group();
        sconceGroup.position.set(sx, sy, sz);
        sconceGroup.rotation.y = sRot;
        houseGroup.add(sconceGroup);

        const sconceBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16), materials.antiqueBrass);
        sconceGroup.add(sconceBody);

        const topLens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 16), materials.warmLed);
        topLens.position.y = 0.085;
        sconceGroup.add(topLens);

        const btmLens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 16), materials.warmLed);
        btmLens.position.y = -0.085;
        sconceGroup.add(btmLens);
      });

      // Zone 1: Living Salon
      const living = new THREE.Group();
      houseGroup.add(living);

      const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.015, 3.4), materials.carpetGrey);
      rug.position.set(-2.8, 0.008, 0.2);
      rug.receiveShadow = true;
      living.add(rug);

      // Architectural Designer Sectional Sofa (Authentic Blender 3D Model)
      const sofaModel = createGlbFurnitureModel('sofa-sectional', () => {
        const fallbackGroup = new THREE.Group();
        const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.38, 1.05), materials.oakLight);
        sofaBase.position.set(0, 0, 0);
        fallbackGroup.add(sofaBase);
        return fallbackGroup;
      });
      sofaModel.position.set(-2.8, 0.36, 1.05);
      living.add(sofaModel);

      // Movable coffee table and lounge seating are dynamically placed and rearranged in spawnedProps

      const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.98), new THREE.MeshBasicMaterial({ map: textures.sunset }));
      tvScreen.position.set(-2.8, 1.85, -d / 2 + 0.125);
      living.add(tvScreen);

      // Feature Linear Fireplace
      const fireplaceGroup = new THREE.Group();
      fireplaceGroup.position.set(-2.8, 0.65, -d / 2 + 0.14);
      living.add(fireplaceGroup);

      const fpSurround = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.25, 0.22), materials.fireplaceStone);
      fpSurround.castShadow = true;
      fireplaceGroup.add(fpSurround);

      const fpHearth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.18), materials.wallEdge);
      fpHearth.position.set(0, -0.15, 0.03);
      fireplaceGroup.add(fpHearth);

      const fpFlames = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.1), materials.warmLed);
      fpFlames.position.set(0, -0.3, 0.05);
      fireplaceGroup.add(fpFlames);

      const fireLight = new THREE.PointLight(0xff681e, isLightFixturesOn ? 1.8 : 0.2, 5.0);
      fireLight.position.set(0, -0.05, 0.28);
      fireplaceGroup.add(fireLight);
      fireLightRef.current = fireLight;

      fpSurround.userData = { type: 'fireplace' };
      interactiveObjectsRef.current.push(fpSurround);

      // Interactive Sliding Pocket Door
      const doorGroup = new THREE.Group();
      doorGroup.position.set(0, 1.1, -0.75);
      houseGroup.add(doorGroup);

      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.18, 1.05), materials.charcoalMetal);
      doorMesh.castShadow = true;
      doorMesh.receiveShadow = true;
      doorMesh.userData = { type: 'slidingDoor' };
      doorGroup.add(doorMesh);
      villaDoorRef.current = doorGroup;
      interactiveObjectsRef.current.push(doorMesh);

      // Contact Shadows
      const sofaShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), materials.shadowContact);
      sofaShadow.rotation.x = -Math.PI / 2;
      sofaShadow.position.set(-2.8, 0.003, 1.2);
      living.add(sofaShadow);

      // Zone 2: Gourmet Kitchen
      const kitchen = new THREE.Group();
      houseGroup.add(kitchen);

      // Sculptural Calacatta Viola Waterfall Marble Island (Authentic Blender 3D Model)
      const islandModel = createGlbFurnitureModel('kitchen-island', () => {
        const fallback = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.05), materials.kitchenWhiteMarble);
        fallback.castShadow = true;
        return fallback;
      });
      islandModel.position.set(2.8, 0.45, -2.4);
      islandModel.userData = { propId: 'struct-island', name: "Chef's Kitchen Marble & Fluted Cedar Island", isStructural: true };
      structuralMeshesRef.current.set('struct-island', islandModel);
      kitchen.add(islandModel);

      // Dining Pendant Light Cluster
      const diningPendantGroup = new THREE.Group();
      diningPendantGroup.position.set(2.8, h - 0.1, -1.5);
      kitchen.add(diningPendantGroup);

      [-0.45, 0.45].forEach(ox => {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.1), materials.charcoalMetal);
        cord.position.set(ox, -0.55, 0);
        diningPendantGroup.add(cord);

        const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08), materials.brassFixture);
        socket.position.set(ox, -1.1, 0);
        diningPendantGroup.add(socket);

        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), materials.warmLed);
        globe.position.set(ox, -1.24, 0);
        globe.userData = { type: 'lighting' };
        diningPendantGroup.add(globe);
        interactiveObjectsRef.current.push(globe);
      });

      const diningLight = new THREE.PointLight(0xffbe68, isLightFixturesOn ? 1.7 : 0.1, 5.5);
      diningLight.position.set(2.8, h - 1.35, -1.5);
      kitchen.add(diningLight);
      diningLightRef.current = diningLight;

      const islandShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.4), materials.shadowContact);
      islandShadow.rotation.x = -Math.PI / 2;
      islandShadow.position.set(2.8, 0.003, -2.4);
      kitchen.add(islandShadow);

      for (let i = 0; i < 3; i++) {
        const sx = 2.0 + i * 0.8;
        const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), materials.oakLight);
        stoolSeat.position.set(sx, 0.65, -1.65);
        kitchen.add(stoolSeat);
        const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), materials.charcoalMetal);
        stoolLeg.position.set(sx, 0.325, -1.65);
        kitchen.add(stoolLeg);
      }

      // Movable dining table and artisan dining chairs are dynamically placed and rearranged in spawnedProps

      // Zone 3: Master Suite
      const bedroom = new THREE.Group();
      houseGroup.add(bedroom);

      // Bedside Plush Woven Wool Area Rug
      const bedRug = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.015, 2.9), materials.carpetGrey);
      bedRug.position.set(2.6, 0.008, 2.2);
      bedRug.receiveShadow = true;
      bedroom.add(bedRug);

      // Fluted Acoustic Timber Slat Feature Accent Wall Behind Headboard
      const slatWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.1, 2.6), materials.flutedAccent);
      slatWall.position.set(1.44, 1.55, 2.2);
      slatWall.castShadow = true;
      slatWall.receiveShadow = true;
      bedroom.add(slatWall);

      // Ambient Warm LED Backlight Glow atop the Slat Accent Wall
      const slatLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 2.6), materials.warmLed);
      slatLed.position.set(1.47, 3.1, 2.2);
      bedroom.add(slatLed);

      // Real Artisan Mediterranean Platform King Bed
      const masterBed = buildMediterraneanBed(furnitureMaterials);
      masterBed.rotation.y = -Math.PI / 2;
      masterBed.position.set(2.6, 0.575, 2.2);
      masterBed.userData = { propId: 'struct-bed-master', name: 'Built-in Master Bed & Upholstered Headboard', isStructural: true };
      structuralMeshesRef.current.set('struct-bed-master', masterBed);
      bedroom.add(masterBed);

      // Master Suite Architectural Glazing Curtains
      const suiteCurtains = buildArchitecturalCurtains(
        { width: 2.80, height: 2.85 },
        { ...furnitureMaterials, curtain: materials.curtain }
      );
      suiteCurtains.position.set(2.6, 1.42, d / 2 - 0.12);
      bedroom.add(suiteCurtains);

      // Zone Badges
      const spriteLiving = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Living Salon', '42.9 M² • Lounge Suite'), transparent: true, opacity: 0.95 }));
      spriteLiving.scale.set(3.2, 0.98, 1);
      spriteLiving.position.set(-2.8, 2.9, 0.2);
      houseGroup.add(spriteLiving);

      const spriteKitchen = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Kitchen & Dining', '21.5 M² • Gourmet Island'), transparent: true, opacity: 0.95 }));
      spriteKitchen.scale.set(3.2, 0.98, 1);
      spriteKitchen.position.set(2.8, 2.9, -1.8);
      houseGroup.add(spriteKitchen);

      const spriteBed = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Master Bedroom', '21.4 M² • King Suite'), transparent: true, opacity: 0.95 }));
      spriteBed.scale.set(3.2, 0.98, 1);
      spriteBed.position.set(2.8, 2.9, 2.2);
      houseGroup.add(spriteBed);
    } else if (housePlan === 'studio') {
      // ----------------- STUDIO PLAN -----------------
      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
      floorMesh.position.set(0, -0.1, 0);
      floorMesh.receiveShadow = true;
      houseGroup.add(floorMesh);

      const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.4, d + 0.15), materials.floorPlinth);
      plinthMesh.position.set(0, -0.38, 0);
      houseGroup.add(plinthMesh);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
      backWall.position.set(0, h / 2, -d / 2 - 0.1);
      houseGroup.add(backWall);

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
      leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
      houseGroup.add(leftWall);

      const artCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.17), new THREE.MeshStandardMaterial({ map: textures.art, roughness: 0.8 }));
      artCanvasMesh.position.set(-1.85, 2.3, -d / 2 + 0.045);
      houseGroup.add(artCanvasMesh);

      const studioCurtains = buildArchitecturalCurtains(
        { width: 2.85, height: 2.80 },
        { ...furnitureMaterials, curtain: materials.curtain }
      );
      studioCurtains.rotation.y = Math.PI / 2;
      studioCurtains.position.set(-w / 2 + 0.12, 1.40, -0.8);
      houseGroup.add(studioCurtains);

      // Banquette Lounge
      const banquetteBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 3.2), materials.oakLight);
      banquetteBase.position.set(-w / 2 + 0.75, 0.19, -0.6);
      houseGroup.add(banquetteBase);

      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 2.1), materials.cushionCream);
      seatCushion.position.set(-w / 2 + 0.75, 0.46, -0.9);
      houseGroup.add(seatCushion);

      // Transformable Chair
      const cg = new THREE.Group();
      cg.position.set(0.2, 0, 0.6);
      houseGroup.add(cg);
      chairGroupRef.current = cg;
      const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.46), materials.cushionOlive);
      cSeat.position.set(0, 0.38, 0);
      cg.add(cSeat);

      // Joinery Wall with Murphy Bed & Fold Desk
      const joineryGroup = new THREE.Group();
      houseGroup.add(joineryGroup);

      const JOINERY_X = 2.4;
      const JOINERY_Z = -0.5;
      const frameDepth = 0.9;
      const frameHeight = 2.9;

      const pelmet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, frameDepth + 0.15), materials.oakLight);
      pelmet.position.set(JOINERY_X - 0.2, frameHeight - 0.175, JOINERY_Z);
      joineryGroup.add(pelmet);

      const mp = new THREE.Group();
      mp.position.set(JOINERY_X + 0.1, 0.15, JOINERY_Z + frameDepth / 2 - 0.05);
      joineryGroup.add(mp);
      murphyPivotRef.current = mp;

      const BED_WIDTH = 1.65;
      const BED_LENGTH = 2.25;
      const murphyPanel = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH, BED_LENGTH, 0.06), materials.oakLight);
      murphyPanel.position.set(0, BED_LENGTH / 2, 0);
      mp.add(murphyPanel);

      const mMattress = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH - 0.14, BED_LENGTH - 0.15, 0.22), materials.bedLinen);
      mMattress.position.set(0, BED_LENGTH / 2, -0.12);
      mp.add(mMattress);

      // Layered Duvet & Pillows on Murphy Bed
      const mDuvet = new THREE.Mesh(new THREE.BoxGeometry(BED_WIDTH - 0.12, (BED_LENGTH - 0.2) * 0.62, 0.14), materials.bedDuvet);
      mDuvet.position.set(0, (BED_LENGTH / 2) - 0.38, -0.21);
      mp.add(mDuvet);

      [-0.40, 0.40].forEach(px => {
        const mPillow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.12), materials.bedLinen);
        mPillow.position.set(px, BED_LENGTH - 0.38, -0.21);
        mp.add(mPillow);
      });

      // Fold Desk
      const df = new THREE.Group();
      df.position.set(0, 0.75, 0.04);
      mp.add(df);
      deskFoldRef.current = df;

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.58), materials.oakLight);
      deskTop.position.set(0, 0, 0.3);
      df.add(deskTop);

      const screenDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.42), materials.computerScreen);
      screenDisplay.position.set(0, 0.42, 0.07);
      df.add(screenDisplay);

      // Sliding Kitchenette
      const kitchenGroup = new THREE.Group();
      kitchenGroup.position.set(0.2, 0, -d / 2 + 0.5);
      houseGroup.add(kitchenGroup);

      const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.88, 0.65), materials.kitchenStone);
      kitchenCounter.position.set(0, 0.44, 0);
      kitchenGroup.add(kitchenCounter);

      const sp = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.5, 0.08), materials.oakLight);
      sp.position.set(0, 1.25, 0.38);
      kitchenGroup.add(sp);
      slidingDoorRef.current = sp;

      const dl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.75), materials.oakLight);
      dl.position.set(0, 0.84, 0.72);
      dl.scale.set(0.001, 1, 0.001);
      kitchenGroup.add(dl);
      diningLeafRef.current = dl;

      // Projector Screen
      const ps = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.25), materials.projectorScreen);
      ps.position.set(JOINERY_X - 0.75, frameHeight - 0.2 - 1.25 / 2, JOINERY_Z + frameDepth / 2 + 0.13);
      ps.scale.set(1, 0.001, 1);
      ps.visible = false;
      joineryGroup.add(ps);
      projScreenRef.current = ps;

      const pg = new THREE.PointLight(0xff7733, 0, 5.0, 1.5);
      pg.position.set(JOINERY_X - 0.75, frameHeight - 0.8, JOINERY_Z + 1.2);
      houseGroup.add(pg);
      projLightRef.current = pg;

      const br = new THREE.PointLight(0xffab4c, 0, 3.5);
      br.position.set(JOINERY_X + 0.1, 1.5, JOINERY_Z + 0.2);
      houseGroup.add(br);
      bedLightRef.current = br;

      const spriteStudio = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Micro Studio', '35.4 M² • Adaptive Joinery'), transparent: true, opacity: 0.95 }));
      spriteStudio.scale.set(3.2, 0.98, 1);
      spriteStudio.position.set(0, 2.9, 0);
      houseGroup.add(spriteStudio);
    } else if (housePlan === 'loft') {
      // ----------------- LOFT PLAN -----------------
      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floor);
      floorMesh.position.set(0, -0.1, 0);
      floorMesh.receiveShadow = true;
      houseGroup.add(floorMesh);

      const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.4, d + 0.2), materials.floorPlinth);
      plinthMesh.position.set(0, -0.38, 0);
      houseGroup.add(plinthMesh);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), materials.wall);
      backWall.position.set(0, h / 2, -d / 2 - 0.1);
      houseGroup.add(backWall);

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, d), materials.wall);
      leftWall.position.set(-w / 2 - 0.1, h / 2, 0);
      houseGroup.add(leftWall);

      // Central Brutalist Column
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.55, h, 0.55), materials.charcoalMetal);
      column.position.set(0, h / 2, 0);
      column.castShadow = true;
      houseGroup.add(column);
      activePartitions.push({ x: 0, y: h / 2, z: 0, hx: 0.28, hy: h / 2, hz: 0.28 });

      // Creative Atelier
      const workTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), materials.oakLight);
      workTable.position.set(-2.5, 0.74, -1.5);
      houseGroup.add(workTable);

      const compScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), materials.computerScreen);
      compScreen.position.set(-2.5, 1.1, -1.75);
      houseGroup.add(compScreen);

      // Platform Lounge
      const platform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.2), materials.oakDark);
      platform.position.set(2.4, 0.175, 1.2);
      houseGroup.add(platform);

      const tatamiMattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.8), materials.cushionCream);
      tatamiMattress.position.set(2.4, 0.45, 1.2);
      houseGroup.add(tatamiMattress);

      const lowTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.65), materials.oakLight);
      lowTable.position.set(2.4, 0.42, -0.6);
      houseGroup.add(lowTable);

      const spriteLoftA = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Creative Studio', '31.5 M² • Workspace'), transparent: true, opacity: 0.95 }));
      spriteLoftA.scale.set(3.0, 0.92, 1);
      spriteLoftA.position.set(-2.5, 3.0, -1.0);
      houseGroup.add(spriteLoftA);

      const spriteLoftB = new THREE.Sprite(new THREE.SpriteMaterial({ map: createZoneBadge('Platform Lounge', '31.5 M² • Resting Wing'), transparent: true, opacity: 0.95 }));
      spriteLoftB.scale.set(3.0, 0.92, 1);
      spriteLoftB.position.set(2.5, 3.0, 1.0);
      houseGroup.add(spriteLoftB);
    }

    // Update Rapier Boundaries with new partitions
    physicsEngine.updateBoundaries(w, d, h, activePartitions);

    // Update 3D Navigation Topology & Avatars for new plan
    navigationEngine.setPlan(housePlan, roomDimensions);
    avatarManager.onPlanChanged(housePlan, roomDimensions);

    // Build Outdoor Cantilevered Terrace & Infinity Pool
    const terraceGroup = terraceGroupRef.current;
    if (terraceGroup) {
      while (terraceGroup.children.length > 0) {
        const child = terraceGroup.children[0];
        terraceGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
      }

      if (showOutdoorTerrace) {
        const deckW = w + 1.8;
        const deckD = 4.4;
        const deckZ = d / 2 + deckD / 2;

        // Timber Deck
        const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, 0.22, deckD), materials.teakDeck);
        deck.position.set(0, -0.11, deckZ);
        deck.receiveShadow = true;
        terraceGroup.add(deck);

        // Deck foundation plinth
        const deckPlinth = new THREE.Mesh(new THREE.BoxGeometry(deckW + 0.1, 0.38, deckD + 0.1), materials.floorPlinth);
        deckPlinth.position.set(0, -0.41, deckZ);
        terraceGroup.add(deckPlinth);

        // Sunk Infinity Pool on Right
        const poolW = Math.min(4.8, deckW * 0.44);
        const poolD = 3.2;
        const poolX = deckW * 0.22;
        const poolZ = deckZ;

        const poolCoping = new THREE.Mesh(new THREE.BoxGeometry(poolW, 0.18, poolD), materials.kitchenWhiteMarble);
        poolCoping.position.set(poolX, -0.11, poolZ);
        poolCoping.receiveShadow = true;
        terraceGroup.add(poolCoping);

        const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(poolW - 0.25, poolD - 0.25), materials.waterMesh);
        poolWater.rotation.x = -Math.PI / 2;
        poolWater.position.set(poolX, -0.06, poolZ);
        poolWater.receiveShadow = true;
        terraceGroup.add(poolWater);
        waterMeshRef.current = poolWater;

        // Modern Glass & Metal Balustrade (Far Edge)
        const balustradeZ = d / 2 + deckD - 0.08;
        const glassRailing = new THREE.Mesh(new THREE.BoxGeometry(deckW, 0.95, 0.04), materials.deckGlass);
        glassRailing.position.set(0, 0.48, balustradeZ);
        terraceGroup.add(glassRailing);

        const handrail = new THREE.Mesh(new THREE.BoxGeometry(deckW, 0.05, 0.08), materials.charcoalMetal);
        handrail.position.set(0, 0.96, balustradeZ);
        terraceGroup.add(handrail);

        // Side railings
        const sideGlassR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, deckD), materials.deckGlass);
        sideGlassR.position.set(deckW / 2 - 0.08, 0.48, deckZ);
        terraceGroup.add(sideGlassR);

        const sideRailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, deckD), materials.charcoalMetal);
        sideRailR.position.set(deckW / 2 - 0.08, 0.96, deckZ);
        terraceGroup.add(sideRailR);

        const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, deckD), materials.deckGlass);
        sideGlassL.position.set(-deckW / 2 + 0.08, 0.48, deckZ);
        terraceGroup.add(sideGlassL);

        const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, deckD), materials.charcoalMetal);
        sideRailL.position.set(-deckW / 2 + 0.08, 0.96, deckZ);
        terraceGroup.add(sideRailL);

        // Luxury Daybeds / Sun Loungers on Left Deck
        const lounger1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 2.0), materials.oakLight);
        lounger1.position.set(-deckW * 0.28, 0.11, deckZ - 0.4);
        lounger1.castShadow = true;
        terraceGroup.add(lounger1);

        const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 1.9), materials.cushionCream);
        cushion1.position.set(-deckW * 0.28, 0.27, deckZ - 0.4);
        terraceGroup.add(cushion1);

        const lounger2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 2.0), materials.oakLight);
        lounger2.position.set(-deckW * 0.28 + 1.2, 0.11, deckZ - 0.4);
        lounger2.castShadow = true;
        terraceGroup.add(lounger2);

        const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 1.9), materials.cushionCream);
        cushion2.position.set(-deckW * 0.28 + 1.2, 0.27, deckZ - 0.4);
        terraceGroup.add(cushion2);

        // Architectural Planters
        const planter1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.45), materials.potCeramic);
        planter1.position.set(-deckW * 0.28, 0.28, balustradeZ - 0.35);
        planter1.castShadow = true;
        terraceGroup.add(planter1);

        const shrub1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.35), materials.plantLeaf);
        shrub1.position.set(-deckW * 0.28, 0.65, balustradeZ - 0.35);
        terraceGroup.add(shrub1);
      }
    }
  }, [housePlan, roomDimensions, materials, textures, showOutdoorTerrace]);

  // Build Hotspots for Current Plan
  useEffect(() => {
    const group = hotspotsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    hotspotCollidersRef.current = [];

    const currentHotspots = HOTSPOTS_DATA.filter(h => h.plan === housePlan);

    const coreGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });
    const innerRingGeo = new THREE.RingGeometry(0.12, 0.16, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xe5b869, side: THREE.DoubleSide });
    const outerRingGeo = new THREE.RingGeometry(0.20, 0.24, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xffe8ab, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const hitGeo = new THREE.SphereGeometry(0.38, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    currentHotspots.forEach(hs => {
      const beacon = new THREE.Group();
      beacon.position.set(hs.pos[0], hs.pos[1], hs.pos[2]);

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
      collider.userData = { hotspot: hs };
      beacon.add(collider);
      hotspotCollidersRef.current.push(collider);

      group.add(beacon);
    });

    group.visible = appMode === 'presentation';
  }, [housePlan, appMode]);

  // Build BIM Dimension Rulers
  useEffect(() => {
    const group = dimensionsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const { width: w, depth: d, height: h } = roomDimensions;
    const lineMat = new THREE.LineBasicMaterial({ color: 0xd49b42, linewidth: 2 });

    // Width
    const zOffset = d / 2 + 0.65;
    const wPts = [new THREE.Vector3(-w / 2, 0.1, zOffset), new THREE.Vector3(w / 2, 0.1, zOffset)];
    const wLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wPts), lineMat);
    group.add(wLine);

    const wSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createDimensionLabelTexture(`W ${w.toFixed(2)} m`), transparent: true }));
    wSprite.scale.set(1.8, 0.45, 1);
    wSprite.position.set(0, 0.5, zOffset);
    group.add(wSprite);

    // Depth
    const xOffset = w / 2 + 0.65;
    const dPts = [new THREE.Vector3(xOffset, 0.1, -d / 2), new THREE.Vector3(xOffset, 0.1, d / 2)];
    const dLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(dPts), lineMat);
    group.add(dLine);

    const dSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createDimensionLabelTexture(`D ${d.toFixed(2)} m`), transparent: true }));
    dSprite.scale.set(1.8, 0.45, 1);
    dSprite.position.set(xOffset, 0.5, 0);
    group.add(dSprite);

    // Height
    const hPts = [new THREE.Vector3(-w / 2 - 0.5, 0, -d / 2 - 0.5), new THREE.Vector3(-w / 2 - 0.5, h, -d / 2 - 0.5)];
    const hLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), lineMat);
    group.add(hLine);

    const hSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createDimensionLabelTexture(`H ${h.toFixed(2)} m`), transparent: true }));
    hSprite.scale.set(1.8, 0.45, 1);
    hSprite.position.set(-w / 2 - 0.5, h / 2, -d / 2 - 0.5);
    group.add(hSprite);

    group.visible = showDimensions && appMode === 'studio';
  }, [roomDimensions, showDimensions, appMode]);

  // ArchiCAD 2D Top-Down Presentation Overlay (Plan View)
  useEffect(() => {
    const cadGroup = cadPresentationGroupRef.current;
    if (!cadGroup) return;

    while (cadGroup.children.length > 0) {
      const child = cadGroup.children[0];
      cadGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    if (cameraView !== 'plan') {
      cadGroup.visible = false;
      return;
    }

    cadGroup.visible = true;
    const { width: w, depth: d } = roomDimensions;

    // 1. Subtle CAD Drafting Metric Grid (1.0m grid with 5.0m major lines)
    const gridHelper = new THREE.GridHelper(Math.max(w, d) + 8, Math.round(Math.max(w, d) + 8), 0x00f5d4, 0x5a544e);
    gridHelper.position.y = 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.28;
    cadGroup.add(gridHelper);

    // 2. 1:1 Metric BIM Dimension Chains
    if (showDimensions) {
      const dimLineMat = new THREE.LineBasicMaterial({ color: 0xdfb15b, linewidth: 2 });

      // Top Exterior Wall Dimension Chain (Width)
      const topZ = -d / 2 - 0.75;
      const topPts = [
        new THREE.Vector3(-w / 2, 0.06, topZ),
        new THREE.Vector3(w / 2, 0.06, topZ)
      ];
      cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts), dimLineMat));

      // Top Extension Witness Lines & 45° CAD Ticks
      [-w / 2, w / 2].forEach(tx => {
        const witness = [new THREE.Vector3(tx, 0.06, -d / 2 - 0.1), new THREE.Vector3(tx, 0.06, topZ - 0.25)];
        cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(witness), dimLineMat));
        const tick = [new THREE.Vector3(tx - 0.12, 0.06, topZ - 0.12), new THREE.Vector3(tx + 0.12, 0.06, topZ + 0.12)];
        cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tick), dimLineMat));
      });

      const topLabel = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createDimensionLabelTexture(`${w.toFixed(2)} m`),
        transparent: true
      }));
      topLabel.scale.set(1.9, 0.5, 1);
      topLabel.position.set(0, 0.15, topZ);
      cadGroup.add(topLabel);

      // Left Exterior Wall Dimension Chain (Depth)
      const leftX = -w / 2 - 0.75;
      const leftPts = [
        new THREE.Vector3(leftX, 0.06, -d / 2),
        new THREE.Vector3(leftX, 0.06, d / 2)
      ];
      cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPts), dimLineMat));

      // Left Extension Witness Lines & 45° CAD Ticks
      [-d / 2, d / 2].forEach(tz => {
        const witness = [new THREE.Vector3(-w / 2 - 0.1, 0.06, tz), new THREE.Vector3(leftX - 0.25, 0.06, tz)];
        cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(witness), dimLineMat));
        const tick = [new THREE.Vector3(leftX - 0.12, 0.06, tz - 0.12), new THREE.Vector3(leftX + 0.12, 0.06, tz + 0.12)];
        cadGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tick), dimLineMat));
      });

      const leftLabel = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createDimensionLabelTexture(`${d.toFixed(2)} m`),
        transparent: true
      }));
      leftLabel.scale.set(1.9, 0.5, 1);
      leftLabel.position.set(leftX, 0.15, 0);
      cadGroup.add(leftLabel);
    }

    // 3. ArchiCAD 90° Door Swing Clearance Arcs
    if (showCadDoorSwings) {
      const arcMat = new THREE.LineBasicMaterial({ color: 0x00f5d4, linewidth: 2, transparent: true, opacity: 0.85 });
      const createArc = (cx, cz, radius, startAngle, endAngle) => {
        const curve = new THREE.EllipseCurve(cx, cz, radius, radius, startAngle, endAngle, false, 0);
        const pts = curve.getPoints(32).map(p => new THREE.Vector3(p.x, 0.04, p.y));
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat);
      };

      // Villa Entrance Door 90° Swing Arc
      const d1Arc = createArc(-0.06, -1.26, 0.96, 0, Math.PI / 2);
      cadGroup.add(d1Arc);

      // Suite Entrance Door 90° Swing Arc
      const d2Arc = createArc(0, 2.05, 0.90, -Math.PI / 2, 0);
      cadGroup.add(d2Arc);
    }

    // 4. ArchiCAD Room Area Stamp Badges (M²)
    if (showCadRoomTags) {
      const zones = ROOM_ZONES[housePlan] || ROOM_ZONES.villa;
      zones.forEach(z => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: createZoneBadge(z.name, `${z.area} M² • ${z.level}`),
          transparent: true,
          opacity: 0.96
        }));
        sprite.scale.set(3.4, 1.05, 1);
        sprite.position.set(z.center[0], 0.25, z.center[2]);
        cadGroup.add(sprite);
      });
    }

    // 5. True North Orientation Compass Indicator (Top Right)
    const northGroup = new THREE.Group();
    northGroup.position.set(w / 2 + 1.2, 0.1, -d / 2 - 1.2);
    const nCircleGeo = new THREE.RingGeometry(0.38, 0.42, 32);
    nCircleGeo.rotateX(-Math.PI / 2);
    const nCircleMat = new THREE.MeshBasicMaterial({ color: 0xdfb15b, side: THREE.DoubleSide });
    northGroup.add(new THREE.Mesh(nCircleGeo, nCircleMat));

    const nArrowPts = [
      new THREE.Vector3(0, 0.02, 0.35),
      new THREE.Vector3(0, 0.02, -0.45),
      new THREE.Vector3(-0.12, 0.02, -0.25),
      new THREE.Vector3(0, 0.02, -0.45),
      new THREE.Vector3(0.12, 0.02, -0.25)
    ];
    northGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(nArrowPts), new THREE.LineBasicMaterial({ color: 0xdfb15b, linewidth: 2 })));
    cadGroup.add(northGroup);

  }, [cameraView, roomDimensions, housePlan, showDimensions, showCadRoomTags, showCadDoorSwings]);

  // Sync Spawned Props Visual Meshes
  useEffect(() => {
    const group = propsGroupRef.current;
    if (!group) return;

    const existingMeshIds = new Set(group.children.map(c => c.userData.propId));
    const newPropIds = new Set(spawnedProps.map(p => p.id));

    // Remove deleted meshes
    group.children.slice().forEach(child => {
      if (!newPropIds.has(child.userData.propId)) {
        group.remove(child);
        child.traverse(c => {
          if (c.geometry) c.geometry.dispose();
        });
      }
    });

    // Add new meshes
    spawnedProps.forEach(prop => {
      if (!existingMeshIds.has(prop.id)) {
        const type = prop.type;
        const mesh = (prop.isCustomImage || (type && type.startsWith('custom-photo-')))
          ? buildCustomImageModel(prop)
          : buildFurnitureModel(type, furnitureMaterials);

        mesh.userData.propId = prop.id;
        mesh.userData.propType = type;
        mesh.userData.propName = prop.name;

        // Traverse all child meshes so recursive raycasting selects the parent item immediately
        mesh.traverse(child => {
          child.userData.propId = prop.id;
          child.userData.rootProp = mesh;
          child.castShadow = true;
          child.receiveShadow = true;
        });

        mesh.position.set(prop.x, prop.y, prop.z);
        group.add(mesh);
      }
    });
  }, [spawnedProps, materials, furnitureMaterials]);

  // Camera Mode Transitions
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const presets = CAMERA_PRESETS[housePlan] || CAMERA_PRESETS.villa;
    const targetPose = presets[cameraView] || presets.overall;

    if (cameraView === 'walk') {
      controlsRef.current.enabled = false;
      gsap.to(cameraRef.current.position, {
        x: targetPose.pos[0],
        y: 1.65,
        z: targetPose.pos[2],
        duration: 1.2,
        ease: 'power2.inOut'
      });
      playChime(620);
    } else {
      controlsRef.current.enabled = true;
      gsap.to(cameraRef.current.position, {
        x: targetPose.pos[0],
        y: targetPose.pos[1],
        z: targetPose.pos[2],
        duration: 1.4,
        ease: 'power3.inOut'
      });
      gsap.to(controlsRef.current.target, {
        x: targetPose.target[0],
        y: targetPose.target[1],
        z: targetPose.target[2],
        duration: 1.4,
        ease: 'power3.inOut'
      });
      playChime(520);
    }
  }, [cameraView, housePlan]);

  // Seamless Room Glide & Bookmark Jumps (Unified Walk Engine)
  useEffect(() => {
    window.__wolfGlideToBookmark = (key, customDuration) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const bookmarks = ROOM_BOOKMARKS[housePlan] || ROOM_BOOKMARKS.villa;
      const bm = bookmarks[key];
      if (!bm) return;

      const duration = customDuration || 1.4;
      const targetPos = bm.pos;
      const targetLook = bm.target;
      const isOverview = key === 'dollhouse';

      controlsRef.current.enabled = isOverview;

      gsap.to(cameraRef.current.position, {
        x: targetPos[0],
        y: isOverview ? targetPos[1] : 1.65,
        z: targetPos[2],
        duration: duration,
        ease: 'power2.inOut'
      });

      gsap.to(controlsRef.current.target, {
        x: targetLook[0],
        y: isOverview ? targetLook[1] : 1.65,
        z: targetLook[2],
        duration: duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (!isOverview && cameraRef.current) {
            cameraRef.current.lookAt(controlsRef.current.target);
            const forward = new THREE.Vector3();
            cameraRef.current.getWorldDirection(forward);
            walkRotRef.current.yaw = Math.atan2(forward.x, forward.z);
            walkRotRef.current.pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1.0, 1.0));
          }
        }
      });

      playChime(620);

      // VIP Tour Guide Sophia leads to this bookmark room as well
      if (avatarManager) {
        avatarManager.guideTourStop({ key, title: bm.name, desc: bm.name }, housePlan);
      }
    };

    window.__wolfGlideToCoord = (worldX, worldZ) => {
      if (!cameraRef.current) return;
      gsap.to(cameraRef.current.position, {
        x: worldX,
        y: 1.65,
        z: worldZ,
        duration: 1.2,
        ease: 'power2.inOut'
      });
      playChime(560);
    };

    window.__wolfLookAtPos = (targetX, targetY, targetZ) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const tY = targetY !== undefined ? targetY : 1.4;
      gsap.to(controlsRef.current.target, {
        x: targetX,
        y: tY,
        z: targetZ,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (cameraRef.current) {
            cameraRef.current.lookAt(controlsRef.current.target);
            const forward = new THREE.Vector3();
            cameraRef.current.getWorldDirection(forward);
            walkRotRef.current.yaw = Math.atan2(forward.x, forward.z);
            walkRotRef.current.pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1.0, 1.0));
          }
        }
      });
      playChime(640);
    };

    window.__wolfFocusProp = (id) => {
      if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
      let targetObj = null;
      sceneRef.current.traverse(obj => {
        if (obj.userData && obj.userData.propId === id && obj.userData.rootProp) {
          targetObj = obj.userData.rootProp;
        }
      });
      if (targetObj) {
        const wp = new THREE.Vector3();
        targetObj.getWorldPosition(wp);
        controlsRef.current.enabled = true;
        gsap.to(cameraRef.current.position, {
          x: wp.x + 1.25,
          y: wp.y + 0.85,
          z: wp.z + 1.25,
          duration: 1.0,
          ease: 'power2.inOut'
        });
        gsap.to(controlsRef.current.target, {
          x: wp.x,
          y: wp.y + 0.42,
          z: wp.z,
          duration: 1.0,
          ease: 'power2.inOut'
        });
      }
    };
  }, [housePlan]);

  // Pointer Interaction Handlers: Dragging props & Hotspot inspection
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersect = new THREE.Vector3();

    const onPointerDown = (e) => {
      // Don't interact if clicking UI
      if (e.target.closest('.ui-overlay button') ||
          e.target.closest('.unified-walk-container') ||
          e.target.closest('.panel-drawer') ||
          e.target.closest('.info-drawer') ||
          e.target.closest('.modal') ||
          e.target.closest('.pres-spec-modal') ||
          e.target.closest('.dossier-modal-backdrop') ||
          e.target.closest('.tour-director-modal') ||
          e.target.closest('.item-transform-hud') ||
          e.target.closest('.blender-placement-hud')) {
        return;
      }

      if (!cameraRef.current || !rendererRef.current) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Interactive Living Elements (Lights, Fireplace, Pocket Door)
      if (interactiveObjectsRef.current.length > 0) {
        const hits = raycaster.intersectObjects(interactiveObjectsRef.current);
        if (hits.length > 0) {
          const hitType = hits[0].object.userData.type;
          if (hitType === 'lighting' || hitType === 'fireplace') {
            setIsLightFixturesOn(prev => !prev);
            playSwitch();
            return;
          }
          if (hitType === 'slidingDoor' && villaDoorRef.current) {
            const willOpen = !isVillaDoorOpenRef.current;
            isVillaDoorOpenRef.current = willOpen;
            gsap.to(villaDoorRef.current.position, {
              z: willOpen ? -1.75 : -0.75,
              duration: 0.7,
              ease: 'power2.inOut'
            });
            playDoorSlide();
            return;
          }
        }
      }

      // 1:1 Precision Metric Laser Tape Measure Tool
      if (isMeasureToolActiveRef.current) {
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const planeHit = new THREE.Vector3();
        let hitPoint = null;

        const sceneTargets = [];
        if (houseGroupRef.current) sceneTargets.push(...houseGroupRef.current.children);
        if (propsGroupRef.current) sceneTargets.push(...propsGroupRef.current.children);

        const hits = raycaster.intersectObjects(sceneTargets, true);
        if (hits.length > 0) {
          hitPoint = hits[0].point;
        } else if (raycaster.ray.intersectPlane(floorPlane, planeHit)) {
          hitPoint = planeHit;
        }

        if (hitPoint) {
          if (!measureStartPointRef.current) {
            measureStartPointRef.current = hitPoint.clone();
            playSnap();
          } else {
            const p1 = measureStartPointRef.current;
            const p2 = hitPoint.clone();
            const dist = p1.distanceTo(p2);
            if (dist > 0.05) {
              const newMeas = {
                id: `meas-${Date.now()}`,
                p1: [p1.x, p1.y, p1.z],
                p2: [p2.x, p2.y, p2.z],
                dist: dist.toFixed(2),
                label: `${dist.toFixed(2)} m`
              };
              setLaserMeasurements(prev => [...prev, newMeas]);
              playChime(880);
            }
            measureStartPointRef.current = null;
            if (activeMeasurePreviewRef.current) activeMeasurePreviewRef.current.visible = false;
          }
        }
        return;
      }

      // Walk Mode Mouse Look Init
      if (cameraViewRef.current === 'walk') {
        isWalkingDragRef.current = true;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
      }

      // Presentation Mode: Hotspots
      if (appModeRef.current === 'presentation' && hotspotCollidersRef.current.length > 0) {
        const hits = raycaster.intersectObjects(hotspotCollidersRef.current);
        if (hits.length > 0) {
          const hs = hits[0].object.userData.hotspot;
          if (hs) {
            setActiveSpecHotspot(hs);
            playChime(660);
            return;
          }
        }
      }

      // Studio Mode: Props & Structural Elements Drag & Selection
      if (appModeRef.current === 'studio') {
        // If already grabbing via 'G' key and clicked floor -> settle!
        if (activeGrabRef.current.isGrabbing && !activeGrabRef.current.isPointerDown) {
          settleGrab(activeGrabRef.current.propId);
          return;
        }

        const targets = [];
        if (propsGroupRef.current) targets.push(...propsGroupRef.current.children);
        if (houseGroupRef.current) targets.push(...houseGroupRef.current.children);

        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          let hitObj = hits[0].object;
          let propId = hitObj.userData.propId;
          let rootProp = hitObj.userData.rootProp;
          while (!propId && hitObj.parent && hitObj.parent !== sceneRef.current) {
            hitObj = hitObj.parent;
            if (hitObj.userData && hitObj.userData.propId) {
              propId = hitObj.userData.propId;
              if (hitObj.userData.rootProp) rootProp = hitObj.userData.rootProp;
              break;
            }
          }

          if (propId) {
            const isLocked = lockedElementIdsRef.current.includes(propId) || (isStructuralLockedRef.current && propId.startsWith('struct-'));
            setSelectedPropId(propId);

            if (isLocked) {
              // Element is locked: select for BIM inspection & show unlock prompt, but do not drag!
              playChime(360);
              return;
            }

            // Unlocked: Check if user clicked an already selected piece with drawers
            if (selectedPropId === propId && rootProp && rootProp.userData && rootProp.userData.toggleDrawers) {
              rootProp.userData.toggleDrawers();
              playDrawerSlide();
            } else {
              playChime(660);
            }

            // Start direct click-and-drag grab
            startGrab(propId, true);
            dragPlane.constant = 0;
            return;
          }
        } else {
          // Clicked empty space
          if (activeGrabRef.current.isGrabbing) {
            settleGrab(activeGrabRef.current.propId);
          } else {
            setSelectedPropId(null);
          }
        }
      }
    };

    const onPointerMove = (e) => {
      if (!cameraRef.current) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Laser Measuring Tape Mode: Cursor & Live Distance Guide
      if (isMeasureToolActiveRef.current) {
        document.body.style.cursor = 'crosshair';
        if (measureStartPointRef.current && activeMeasurePreviewRef.current) {
          const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const planeHit = new THREE.Vector3();
          let hitPoint = null;

          const sceneTargets = [];
          if (houseGroupRef.current) sceneTargets.push(...houseGroupRef.current.children);
          if (propsGroupRef.current) sceneTargets.push(...propsGroupRef.current.children);

          const hits = raycaster.intersectObjects(sceneTargets, true);
          if (hits.length > 0) {
            hitPoint = hits[0].point;
          } else if (raycaster.ray.intersectPlane(floorPlane, planeHit)) {
            hitPoint = planeHit;
          }

          if (hitPoint) {
            const p1 = measureStartPointRef.current;
            const p2 = hitPoint;
            const dist = p1.distanceTo(p2);

            const previewGrp = activeMeasurePreviewRef.current;
            while (previewGrp.children.length > 0) {
              const c = previewGrp.children.pop();
              if (c.geometry) c.geometry.dispose();
              if (c.material && c.material.dispose) c.material.dispose();
            }

            const pts = [new THREE.Vector3(p1.x, p1.y + 0.04, p1.z), new THREE.Vector3(p2.x, p2.y + 0.04, p2.z)];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
            const lineMat = new THREE.LineDashedMaterial({
              color: 0x00f5d4,
              dashSize: 0.15,
              gapSize: 0.08,
              linewidth: 2
            });
            const line = new THREE.Line(lineGeo, lineMat);
            line.computeLineDistances();
            previewGrp.add(line);

            // Sphere anchor points
            const dotGeo = new THREE.SphereGeometry(0.045, 12, 12);
            const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
            const dotA = new THREE.Mesh(dotGeo, dotMat);
            dotA.position.set(p1.x, p1.y + 0.04, p1.z);
            const dotB = new THREE.Mesh(dotGeo, dotMat);
            dotB.position.set(p2.x, p2.y + 0.04, p2.z);
            previewGrp.add(dotA);
            previewGrp.add(dotB);

            // Floating live measurement badge
            const mid = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 0.28, (p1.z + p2.z) / 2);
            const badgeTex = createLaserMeasureBadgeTexture(`${dist.toFixed(2)} m`);
            const spriteMat = new THREE.SpriteMaterial({ map: badgeTex, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(mid);
            sprite.scale.set(1.4, 0.35, 1);
            previewGrp.add(sprite);

            previewGrp.visible = true;
          }
        }
        return;
      }

      // Studio Mode: Grabbing & Hover Cursor
      if (appModeRef.current === 'studio' && propsGroupRef.current && cameraViewRef.current !== 'walk') {
        const hoverHits = raycaster.intersectObjects(propsGroupRef.current.children, true);
        if (activeGrabRef.current.isGrabbing) {
          document.body.style.cursor = 'grabbing';
        } else if (hoverHits.length > 0) {
          document.body.style.cursor = 'grab';
        } else if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'grabbing' || document.body.style.cursor === 'crosshair') {
          document.body.style.cursor = 'default';
        }
      }

      // Walk Mode Mouse Look
      if (isWalkingDragRef.current && cameraViewRef.current === 'walk' && cameraRef.current) {
        const dx = e.clientX - lastPointerRef.current.x;
        const dy = e.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        walkRotRef.current.yaw -= dx * 0.0035;
        walkRotRef.current.pitch = Math.max(-1.1, Math.min(1.1, walkRotRef.current.pitch - dy * 0.0035));
        cameraRef.current.rotation.set(walkRotRef.current.pitch, walkRotRef.current.yaw, 0, 'YXZ');
      }

      // Hotspot Tooltip Hover
      if (appModeRef.current === 'presentation' && hotspotCollidersRef.current.length > 0) {
        const hits = raycaster.intersectObjects(hotspotCollidersRef.current);
        if (hits.length > 0) {
          const hs = hits[0].object.userData.hotspot;
          if (hs) {
            setHotspotTooltip({
              title: hs.title,
              kicker: hs.kicker,
              x: e.clientX,
              y: e.clientY
            });
            document.body.style.cursor = 'pointer';
          }
        } else {
          setHotspotTooltip(null);
          document.body.style.cursor = 'default';
        }
      }

      // Dragging / Moving Prop or Structural Element smoothly across floor
      if (activeGrabRef.current.isGrabbing) {
        const curPropId = activeGrabRef.current.propId;

        if (activeGrabRef.current.isStructural) {
          const structMesh = structuralMeshesRef.current.get(curPropId);
          if (structMesh && raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
            const roomW = roomDimensionsRef.current.width;
            const roomD = roomDimensionsRef.current.depth;
            const halfW = roomW / 2 + 1.2;
            const halfD = roomD / 2 + 1.2;

            let targetX = planeIntersect.x;
            let targetZ = planeIntersect.z;

            if (activeGrabRef.current.axisLock === 'x') {
              targetZ = activeGrabRef.current.initialZ;
            } else if (activeGrabRef.current.axisLock === 'z') {
              targetX = activeGrabRef.current.initialX;
            }

            const clampedX = Math.max(-halfW, Math.min(halfW, targetX));
            const clampedZ = Math.max(-halfD, Math.min(halfD, targetZ));

            structMesh.position.x = clampedX;
            structMesh.position.z = clampedZ;
            updateFootprintVisuals(curPropId, clampedX, clampedZ, new THREE.Quaternion(), false, activeGrabRef.current.axisLock);
          }
          return;
        }

        const record = physicsEngine.physicsObjects.get(curPropId);
        if (record && record.body) {
          if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
            const roomW = roomDimensionsRef.current.width;
            const roomD = roomDimensionsRef.current.depth;
            const halfW = roomW / 2 - 0.40;
            const halfD = roomD / 2 - 0.40;

            let targetX = planeIntersect.x;
            let targetZ = planeIntersect.z;

            // Apply Axis Lock if engaged
            if (activeGrabRef.current.axisLock === 'x') {
              targetZ = activeGrabRef.current.initialZ;
            } else if (activeGrabRef.current.axisLock === 'z') {
              targetX = activeGrabRef.current.initialX;
            }

            const clampedX = Math.max(-halfW, Math.min(halfW, targetX));
            const clampedZ = Math.max(-halfD, Math.min(halfD, targetZ));

            const dim = physicsEngine.getDimensions(record.type);
            const halfH = dim.height / 2;
            const supportingY = physicsEngine.getSupportingSurfaceY(clampedX, clampedZ, curPropId, record.type);
            const targetY = supportingY + halfH + activeGrabRef.current.liftY;

            record.body.setTranslation({
              x: clampedX,
              y: targetY,
              z: clampedZ
            }, true);
            record.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            record.body.wakeUp();

            const curRot = record.body.rotation();
            const curQ = new THREE.Quaternion(curRot.x, curRot.y, curRot.z, curRot.w);
            updateFootprintVisuals(curPropId, clampedX, clampedZ, curQ, true, activeGrabRef.current.axisLock);
          }
        }
      }
    };

    const onPointerUp = () => {
      isWalkingDragRef.current = false;
      // If was dragging via pointer down, settle down on release!
      if (activeGrabRef.current.isGrabbing && activeGrabRef.current.isPointerDown) {
        settleGrab(activeGrabRef.current.propId);
      }
      if (document.body.style.cursor === 'grabbing') {
        document.body.style.cursor = 'grab';
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [appMode, roomDimensions, setActiveSpecHotspot, setHotspotTooltip, setSelectedPropId, cameraView, setIsLightFixturesOn]);

  // Automated Cinematic Tour Playback Loop
  useEffect(() => {
    if (!isTourActive || isTourPaused || !cameraRef.current || !controlsRef.current) return;

    const route = customTourMoves.length > 0 ? customTourMoves : (TOUR_ROUTES[housePlan] || TOUR_ROUTES.villa);
    const bookmarks = ROOM_BOOKMARKS[housePlan] || ROOM_BOOKMARKS.villa;
    if (tourStopIndex >= route.length) {
      setIsTourActive(false);
      return;
    }

    const currentStop = route[tourStopIndex];
    let pos = currentStop.pos;
    let target = currentStop.target;

    if (!pos && currentStop.key && bookmarks[currentStop.key]) {
      pos = bookmarks[currentStop.key].pos;
      target = bookmarks[currentStop.key].target;
    }

    if (!pos) return;

    const stepDuration = (currentStop.duration || 3.8) / tourSpeed;

    // Orchestrate VIP Tour Guide Sophia to lead and present this stop
    if (avatarManager) {
      avatarManager.guideTourStop(currentStop, housePlan);
    }

    // Tween camera
    gsap.to(cameraRef.current.position, {
      x: pos[0] !== undefined ? pos[0] : pos.x,
      y: pos[1] !== undefined ? pos[1] : pos.y,
      z: pos[2] !== undefined ? pos[2] : pos.z,
      duration: stepDuration,
      ease: 'power2.inOut'
    });

    gsap.to(controlsRef.current.target, {
      x: target[0] !== undefined ? target[0] : target.x,
      y: target[1] !== undefined ? target[1] : target.y,
      z: target[2] !== undefined ? target[2] : target.z,
      duration: stepDuration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (cameraViewRef.current === 'walk' && cameraRef.current) {
          cameraRef.current.lookAt(controlsRef.current.target);
          const forward = new THREE.Vector3();
          cameraRef.current.getWorldDirection(forward);
          walkRotRef.current.yaw = Math.atan2(forward.x, forward.z);
          walkRotRef.current.pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1.0, 1.0));
        }
      }
    });

    playChime(580);

    const timer = setTimeout(() => {
      if (tourStopIndex + 1 < route.length) {
        setTourStopIndex(prev => prev + 1);
        setTourProgress(((tourStopIndex + 1) / route.length) * 100);
      } else {
        setIsTourActive(false);
        if (avatarManager) avatarManager.onTourEnded();
      }
    }, stepDuration * 1000);

    return () => clearTimeout(timer);
  }, [isTourActive, isTourPaused, tourStopIndex, tourSpeed, housePlan, customTourMoves]);

  // When tour is stopped manually, notify avatarManager
  useEffect(() => {
    if (!isTourActive && avatarManager) {
      avatarManager.onTourEnded();
    }
  }, [isTourActive]);

  return <div id="canvas-container" ref={containerRef} />;
}
