import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Dual Engine Mode: 'studio' | 'presentation'
export const appModeAtom = atom('studio');

// House Architecture Plan Layout: 'villa' | 'studio' | 'loft'
export const housePlanAtom = atom('villa');

// Aesthetic Style Palette: 'scandi' | 'mediterranean' | 'european' | 'japandi'
export const styleThemeAtom = atom('scandi');

// Camera View Mode: 'overall' | 'joinery' | 'walk' | 'plan'
export const cameraViewAtom = atom('overall');

// Circadian Lifecycle Mode: 0 (Work), 1 (Cook), 2 (Entertain), 3 (Sleep)
export const circadianModeIndexAtom = atom(0);
export const circadianProgressAtom = atom(0.0);
export const isPlayingTimelineAtom = atom(false);

// Atmospheric Mood: 'day' | 'sunset' | 'dusk' | 'night'
export const atmosphereMoodAtom = atom('day');

// Cinema 2.39:1 Letterbox Bar Mode
export const isLetterboxAtom = atom(false);

// Web Audio Ambient Synthesizer
export const isAudioEnabledAtom = atom(false);

// 3D BIM Dimension Rulers Toggle
export const showDimensionsAtom = atom(false);

// Active Panel Drawer: null | 'catalog' | 'cad' | 'info'
export const activeDrawerAtom = atom(null);

// Parametric Room Dimensions (Meters)
export const roomDimensionsAtom = atom({
  width: 11.0,
  depth: 7.8,
  height: 3.4
});

// Derived Atoms for Parametric Area and Volume
export const roomAreaAtom = atom((get) => {
  const { width, depth } = get(roomDimensionsAtom);
  return (width * depth).toFixed(1);
});

export const roomVolumeAtom = atom((get) => {
  const { width, depth, height } = get(roomDimensionsAtom);
  return (width * depth * height).toFixed(1);
});

// Drapery / Curtain Material Variant: 'sheer' | 'velvet' | 'shoji'
export const curtainStateAtom = atom('sheer');

// Spawned Interactive Props List
export const spawnedPropsAtom = atom([]);

// Universal BIM Structural Elements (Walls, Floors, Partitions, Openings, Fixed Joinery)
export const structuralElementsAtom = atom([
  {
    id: 'struct-floor',
    type: 'floor',
    name: 'Foundation & Floor Slab',
    category: 'Architecture / Floor Slab',
    material: 'Honed Roman Travertine & Lime Plinth',
    dimensions: '11.00m × 0.20m × 7.80m',
    isStructural: true,
    x: 0,
    y: -0.1,
    z: 0
  },
  {
    id: 'struct-wall-back',
    type: 'wall',
    name: 'Exterior Back Limewash Wall',
    category: 'Architecture / Exterior Wall',
    material: 'Natural Limewash Plaster & Charcoal Edge Reveal',
    dimensions: '11.00m × 3.40m × 0.20m',
    isStructural: true,
    x: 0,
    y: 1.7,
    z: -4.0
  },
  {
    id: 'struct-wall-left',
    type: 'wall',
    name: 'Exterior Left Picture Window Wall',
    category: 'Architecture / Exterior Wall',
    material: 'Natural Limewash Plaster & Charcoal Baseboard',
    dimensions: '0.20m × 3.40m × 7.80m',
    isStructural: true,
    x: -5.6,
    y: 1.7,
    z: 0
  },
  {
    id: 'struct-partition-main',
    type: 'partition',
    name: 'Interior Suite Dividing Partition Wall',
    category: 'Architecture / Interior Partition',
    material: 'Solid Plaster Partition with Lintel Opening',
    dimensions: '0.20m × 3.40m × 3.60m',
    isStructural: true,
    x: 0.5,
    y: 1.7,
    z: 1.8
  },
  {
    id: 'struct-window-main',
    type: 'opening',
    name: 'Architectural Picture Window Frame',
    category: 'Architecture / Glazed Opening',
    material: 'Charcoal Aluminum Frame, Low-E Glass & Stone Sill',
    dimensions: '3.65m × 2.40m × 0.12m',
    isStructural: true,
    x: -5.48,
    y: 1.8,
    z: -1.0
  },
  {
    id: 'struct-island',
    type: 'island',
    name: "Chef's Kitchen Marble & Fluted Cedar Island",
    category: 'Architecture / Fixed Joinery',
    material: 'Honed Calacatta Marble & Fluted Cedar Joinery',
    dimensions: '2.80m × 0.92m × 1.10m',
    isStructural: true,
    x: 2.8,
    y: 0.46,
    z: -2.1
  },
  {
    id: 'struct-bed-master',
    type: 'bed',
    name: 'Built-in Master Bed & Upholstered Headboard',
    category: 'Architecture / Bedroom Suite',
    material: 'Mediterranean Cedar Plinth & Oatmeal Linen',
    dimensions: '2.20m × 1.10m × 2.10m',
    isStructural: true,
    x: 2.8,
    y: 0.55,
    z: 1.8
  }
]);

// Global Structural Lock State (Default: true to protect walls/floors during furniture staging)
export const isStructuralLockedAtom = atom(true);

// Set of Individually Locked Element IDs
export const lockedElementIdsAtom = atom([
  'struct-floor',
  'struct-wall-back',
  'struct-wall-left',
  'struct-partition-main',
  'struct-window-main',
  'struct-island',
  'struct-bed-master'
]);

// Selected Prop / Element ID for HUD Controls
export const selectedPropIdAtom = atom(null);

// Universal Selected Entity (Searches both furniture props and structural BIM objects)
export const selectedPropAtom = atom((get) => {
  const id = get(selectedPropIdAtom);
  if (!id) return null;

  const isGlobalLocked = get(isStructuralLockedAtom);
  const lockedIds = get(lockedElementIdsAtom);

  // Check spawned furniture props first
  const props = get(spawnedPropsAtom);
  const foundProp = props.find(p => p.id === id);
  if (foundProp) {
    const isLocked = lockedIds.includes(id);
    return {
      ...foundProp,
      isStructural: false,
      isLocked
    };
  }

  // Check structural BIM elements
  const structs = get(structuralElementsAtom);
  const foundStruct = structs.find(s => s.id === id);
  if (foundStruct) {
    const isLocked = isGlobalLocked || lockedIds.includes(id);
    return {
      ...foundStruct,
      isStructural: true,
      isLocked
    };
  }

  // Fallback generic object representation
  return {
    id,
    name: 'Architectural Element',
    type: 'object',
    isStructural: id.startsWith('struct-'),
    isLocked: id.startsWith('struct-') ? isGlobalLocked : false
  };
});

// ArchiCAD Presentation Mode States
export const archicadScaleAtom = atom('1:50'); // '1:20' | '1:50' | '1:100'
export const showCadRoomTagsAtom = atom(true);
export const showCadDoorSwingsAtom = atom(true);
export const activeRoomFilterAtom = atom('all'); // 'all' | 'living' | 'kitchen' | 'master' | 'terrace'
export const cadSheetThemeAtom = atom('blueprint'); // 'blueprint' | 'classic' | 'dark'

// Blender-Style Interactive Object Placement & Settle State
export const isGrabbingPropAtom = atom(false);
export const grabAxisLockAtom = atom(null); // null | 'x' | 'z'
export const placementValidAtom = atom(true);
export const placementReasonAtom = atom('Clearance OK');

// 3D Architectural Hotspot Material Spec Modal
export const activeSpecHotspotAtom = atom(null);

// Hovered Hotspot Tooltip state: { title, meta, x, y } | null
export const hotspotTooltipAtom = atom(null);

// Cinematic Automated Tour State
export const isTourActiveAtom = atom(false);
export const isTourPausedAtom = atom(false);
export const tourStopIndexAtom = atom(0);
export const tourProgressAtom = atom(0);
export const tourSpeedAtom = atom(1.0);
export const isTourDirectorOpenAtom = atom(false);
export const customTourMovesAtom = atom([]);

// Status Callout Text
export const statusCalloutAtom = atom('Morning focus • Workstation deployed');

// Camera Target Coordinates for Smooth Transitions
export const cameraTargetAtom = atom({
  position: [16.5, 14.0, 15.2],
  target: [0.5, 1.2, 0],
  duration: 1.6
});

// Walk Mode Active State
export const isWalkModeAtom = atom((get) => get(cameraViewAtom) === 'walk');

// Trigger for Snapshot Screen Flash
export const snapshotFlashTriggerAtom = atom(0);

// Interior Warm Lighting Fixtures Toggle
export const isLightFixturesOnAtom = atom(true);

// Outdoor Terrace / Pool Feature Toggle
export const showOutdoorTerraceAtom = atom(true);

// Client Project Name & Reference ID
export const clientProjectNameAtom = atom('Wolfitway Horizon Villa • San Marino Estate');

// Commercial Investment & Budget Drawer
export const isBudgetDrawerOpenAtom = atom(false);

// Architectural Dossier / PDF Proposal Modal
export const isDossierModalOpenAtom = atom(false);

// Derived Real-Time Architectural Investment & Budget Calculation
export const projectBudgetAtom = atom((get) => {
  const { width, depth } = get(roomDimensionsAtom);
  const area = width * depth;
  const style = get(styleThemeAtom);
  const plan = get(housePlanAtom);
  const props = get(spawnedPropsAtom);

  // Base construction cost: $2,850 per sq meter
  const baseConstruction = Math.round(area * 2850);

  // Style finish package uplift
  const styleMultipliers = {
    scandi: { name: 'Nordic Oak & Lime Plaster', cost: Math.round(area * 220) },
    mediterranean: { name: 'Aegean Terracotta & Aged Cedar', cost: Math.round(area * 380) },
    european: { name: 'Haussmannian Oak & Brass Joinery', cost: Math.round(area * 640) },
    japandi: { name: 'Basalt Charcoal Timber & Shoji Screens', cost: Math.round(area * 490) },
  };
  const stylePackage = styleMultipliers[style] || styleMultipliers.scandi;

  // Architectural Millwork & Custom Joinery Package
  const planJoineryCost = {
    villa: 48500,
    studio: 32000,
    loft: 41500
  }[plan] || 35000;

  // Custom spawned furnishings & fittings
  const customPropsCost = props.length * 2400;

  const subtotal = baseConstruction + stylePackage.cost + planJoineryCost + customPropsCost;
  const engineeringFee = Math.round(subtotal * 0.08); // 8% Architectural & BIM Supervision
  const total = subtotal + engineeringFee;

  return {
    area: area.toFixed(1),
    ratePerSqm: 2850,
    baseConstruction,
    styleName: stylePackage.name,
    styleCost: stylePackage.cost,
    joineryCost: planJoineryCost,
    customPropsCost,
    customPropsCount: props.length,
    engineeringFee,
    total,
    currency: 'USD'
  };
});

// ==========================================
// 3D Spatial Navigation & Avatar Agents
// ==========================================
export const showAvatarsAtom = atom(true);
export const avatarCountAtom = atom(2); // 1, 2, or 3
export const avatarModeAtom = atom('wander'); // 'wander' | 'guided' | 'idle'
export const avatarSelectedTargetRoomAtom = atom('kitchen');
export const showNavPathAtom = atom(true);
export const avatarStatusAtom = atom('AI Occupants initialized • NavMesh active with door passage');
export const activePartitionsAtom = atom([]);

// ==========================================
// 1:1 Precision Metrology & Measuring Tape Tool
// ==========================================
export const isMeasureToolActiveAtom = atom(false);
export const laserMeasurementsAtom = atom([]); // array of { id, p1, p2, distance, label }
export const showClearanceGuidesAtom = atom(true); // 90cm ergonomic circulation guide
export const catalogRoomFilterAtom = atom('all'); // 'all' | 'living' | 'kitchen' | 'bedroom' | 'terrace'

// ==========================================
// AI Image to 3D Model Generator & Custom Products Catalog
// ==========================================
export const isImageTo3dModalOpenAtom = atom(false);
export const customGeneratedModelsAtom = atom([]); // array of custom generated model specs
export const customCatalogProductsAtom = atomWithStorage('wolf3d_custom_catalog_products', []); // persisted custom products


