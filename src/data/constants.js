import * as THREE from 'three';

// Architectural Styles Palette Matrix
export const STYLES = {
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

export const PLAN_SPECS = {
  villa: {
    name: 'Wolfitway Villa Lumina',
    subtitle: 'Bespoke Residence',
    specsBadge: 'WOLFITWAY • PROJECT WOLF 3D • 85.8 M²',
    defaultDim: { width: 11.0, depth: 7.8, height: 3.4 },
    stats: {
      area: '85.8 M²',
      height: '3.4 M',
      daylight: '94%',
      carbon: 'Net-Zero',
      doors: '2 Walkable Doors'
    }
  },
  studio: {
    name: 'Wolfitway Micro Studio',
    subtitle: 'Adaptive Micro Suite',
    specsBadge: 'WOLFITWAY • STUDIO 3D • 35.4 M²',
    defaultDim: { width: 6.8, depth: 5.2, height: 3.4 },
    stats: {
      area: '35.4 M²',
      height: '3.4 M',
      daylight: '91%',
      carbon: 'Net-Zero',
      doors: '1 Sliding Pocket Door'
    }
  },
  loft: {
    name: 'Wolfitway Industrial Loft',
    subtitle: 'Creative Open Plan',
    specsBadge: 'WOLFITWAY • LOFT 3D • 63.0 M²',
    defaultDim: { width: 9.0, depth: 7.0, height: 3.8 },
    stats: {
      area: '63.0 M²',
      height: '3.8 M',
      daylight: '97%',
      carbon: 'Net-Zero',
      doors: 'Open Portal Arch'
    }
  },
  urban2bed: {
    name: 'Wolfitway Urban 2-Bedroom',
    subtitle: 'Dual Suite & Central Loggia',
    specsBadge: 'WOLFITWAY • URBAN 2-BED • 72.0 M²',
    defaultDim: { width: 10.0, depth: 7.2, height: 3.2 },
    stats: {
      area: '72.0 M²',
      height: '3.2 M',
      daylight: '95%',
      carbon: 'Net-Zero',
      doors: '3 Interior En-Suite Doors'
    }
  }
};

export const CAMERA_PRESETS = {
  villa: {
    overall: { pos: [0.0, 2.2, 5.8], target: [-0.2, 1.4, -0.6] },
    joinery: { pos: [4.8, 4.8, -1.8], target: [2.6, 1.3, -1.8] },
    plan: { pos: [0.01, 23.0, 0.01], target: [0, 0, 0] },
    walk: { pos: [-0.6, 1.65, 2.8], target: [-0.6, 1.4, -0.6] }
  },
  studio: {
    overall: { pos: [12.5, 9.8, 11.2], target: [0.2, 1.4, -0.2] },
    joinery: { pos: [5.2, 4.4, 4.2], target: [1.8, 2.0, -0.6] },
    plan: { pos: [0.01, 16.5, 0.01], target: [0, 0, 0] },
    walk: { pos: [0, 1.65, 1.8], target: [0, 1.65, -0.5] }
  },
  loft: {
    overall: { pos: [14.5, 12.0, 13.5], target: [0, 1.5, 0] },
    joinery: { pos: [3.5, 4.2, 2.8], target: [1.5, 1.2, 1.0] },
    plan: { pos: [0.01, 20.0, 0.01], target: [0, 0, 0] },
    walk: { pos: [-2.0, 1.65, 1.5], target: [0, 1.65, 0] }
  },
  urban2bed: {
    overall: { pos: [15.0, 13.0, 14.0], target: [0, 1.2, 0] },
    joinery: { pos: [4.2, 4.2, -1.5], target: [1.8, 1.2, -0.8] },
    plan: { pos: [0.01, 21.0, 0.01], target: [0, 0, 0] },
    walk: { pos: [-1.8, 1.65, 1.2], target: [0, 1.65, 0] }
  }
};

export const MODES = [
  {
    name: 'Work',
    num: '01',
    timeStr: '08:30 AM',
    callout: 'Morning focus &bull; Workstation deployed &bull; Natural daylight'
  },
  {
    name: 'Cook',
    num: '02',
    timeStr: '01:15 PM',
    callout: 'Midday meal &bull; Chef counter &bull; Sun-drenched atmosphere'
  },
  {
    name: 'Entertain',
    num: '03',
    timeStr: '07:45 PM',
    callout: 'Cinema & social lounge &bull; Golden hour ambient glow'
  },
  {
    name: 'Sleep',
    num: '04',
    timeStr: '11:30 PM',
    callout: 'Night rest &bull; Master suite retreat &bull; Warm amber reading lights'
  }
];

export const ATMOSPHERE_MOODS = {
  day: {
    sunColor: 0xfff6ea,
    sunIntensity: 2.3,
    sunPos: [-10, 14, -5],
    ambientColor: 0xfff8f0,
    ambientIntensity: 1.25,
    bg: 0xd7cfc4,
    ledIntensity: 0.3,
    exposure: 1.08
  },
  sunset: {
    sunColor: 0xff8c38,
    sunIntensity: 3.4,
    sunPos: [-14, 4.2, -4],
    ambientColor: 0x6e4835,
    ambientIntensity: 0.85,
    bg: 0x362520,
    ledIntensity: 2.4,
    exposure: 1.20
  },
  dusk: {
    sunColor: 0x486498,
    sunIntensity: 0.9,
    sunPos: [-12, 2.5, -4],
    ambientColor: 0x222635,
    ambientIntensity: 0.65,
    bg: 0x161824,
    ledIntensity: 3.0,
    exposure: 1.28
  },
  night: {
    sunColor: 0x335599,
    sunIntensity: 0.5,
    sunPos: [-10, 8, -5],
    ambientColor: 0x11131c,
    ambientIntensity: 0.45,
    bg: 0x0c0e14,
    ledIntensity: 3.4,
    exposure: 1.35
  }
};

export const ROOM_BOOKMARKS = {
  villa: {
    entrance: { pos: [-5.2, 1.8, 3.8], target: [-1.2, 1.4, 0], name: 'Grand Entrance' },
    salon: { pos: [-0.6, 1.5, 2.6], target: [-0.6, 1.2, -0.6], name: 'Living Salon' },
    kitchen: { pos: [1.4, 1.8, -3.2], target: [2.8, 1.1, -1.8], name: "Chef's Island" },
    suite: { pos: [1.2, 1.7, 1.8], target: [3.2, 1.1, 2.2], name: 'Master Suite' },
    terrace: { pos: [0.0, 2.2, 5.8], target: [-0.2, 1.4, -0.6], name: 'Sunset Panoramic Terrace' },
    dollhouse: { pos: [15.5, 13.5, 14.5], target: [0.5, 1.0, 0], name: '3D Dollhouse' }
  },
  studio: {
    entrance: { pos: [0, 1.7, 2.6], target: [0, 1.3, -0.6], name: 'Studio Entry' },
    salon: { pos: [-1.8, 1.5, 0.8], target: [1.2, 1.3, -0.2], name: 'Transform Lounge' },
    kitchen: { pos: [0.4, 1.6, 0.8], target: [-1.8, 1.2, -0.4], name: 'Chef Counter' },
    suite: { pos: [0.2, 1.6, 1.2], target: [2.0, 1.3, -0.6], name: 'Fold-out Sanctuary' },
    terrace: { pos: [-2.2, 1.8, -1.6], target: [-3.5, 1.8, -1.6], name: 'Window Bay' },
    dollhouse: { pos: [11.0, 9.5, 10.2], target: [0, 1.0, 0], name: 'Studio Dollhouse' }
  },
  loft: {
    entrance: { pos: [-3.8, 1.8, 3.2], target: [0, 1.4, 0], name: 'Loft Threshold' },
    salon: { pos: [-2.2, 1.6, 1.4], target: [1.2, 1.1, 0.6], name: 'Open Living' },
    kitchen: { pos: [1.2, 1.8, -2.4], target: [2.2, 1.2, -1.2], name: 'Monolithic Bar' },
    suite: { pos: [2.0, 1.7, 1.6], target: [3.2, 1.2, 1.8], name: 'Platform Bed' },
    terrace: { pos: [-3.2, 2.0, -2.0], target: [-4.5, 2.0, -2.0], name: 'High Glazing' },
    dollhouse: { pos: [13.8, 11.8, 12.8], target: [0, 1.2, 0], name: 'Loft Diorama' }
  }
};

export const TOUR_ROUTES = {
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

export const HOTSPOTS_DATA = [
  // Villa Hotspots
  {
    id: 'hs-marble',
    plan: 'villa',
    title: 'Calacatta Viola Marble Island',
    kicker: 'NATURAL STONE // GOURMET ISLAND',
    pos: [2.8, 1.15, -1.8],
    narrative: 'Monolithic sculptural kitchen island featuring dramatic burgundy-violet veining on a warm cream ground. Honed matte finish with invisible stain-resistant nanocoating and mitered waterfall edges.',
    prov: 'Carrara, Italy',
    finish: 'Low-Sheen Honed (12 GU)',
    thermal: 'High Thermal Mass Buffer',
    sustain: 'Zero-VOC • EPD Certified',
    camPos: [1.6, 1.6, -2.8],
    camTarget: [2.8, 1.1, -1.8]
  },
  {
    id: 'hs-oak',
    plan: 'villa',
    title: 'French White Oak Chevron Parquet',
    kicker: 'ARCHITECTURAL FLOORING // LIVING SALON',
    pos: [-2.8, 0.22, 0.2],
    narrative: 'Precision 45-degree chevron parquet in sustainably harvested French White Oak. Acoustic underlay dampens footfall while UV-cured oil finish enhances organic grain bounce.',
    prov: 'Burgundy, France',
    finish: 'Natural Ultra-Matte Oil',
    thermal: 'Radiant In-Slab Ready',
    sustain: 'FSC 100% • Low Carbon',
    camPos: [-2.8, 1.25, 1.4],
    camTarget: [-2.8, 0.0, 0.2]
  },
  {
    id: 'hs-partition',
    plan: 'villa',
    title: 'Concealed Kinematic Pocket Portals',
    kicker: 'ADAPTIVE JOINERY // PARTITION SUITE',
    pos: [0, 1.8, -0.75],
    narrative: 'Ceiling-recessed motorized sliding portals with acoustic drop seals. Enables fluid transitions between open entertainment mode and private retreat zones.',
    prov: 'Milan, Italy',
    finish: 'Fluted Smoked Oak & Slate',
    thermal: 'Rw 42 dB Sound Isolation',
    sustain: 'Modular Circular System',
    camPos: [-1.4, 1.7, -0.75],
    camTarget: [0.2, 1.6, -0.75]
  },
  {
    id: 'hs-glazing',
    plan: 'villa',
    title: 'Panoramic Low-E Curtain Wall',
    kicker: 'ARCHITECTURAL ENVELOPE // WEST VISTA',
    pos: [-5.35, 1.8, -1.0],
    narrative: 'Minimalist structural triple-glazing with thermally broken concealed aluminum profiles. Specially calibrated for maximum natural daylight transmittance (94%) with minimal solar heat gain.',
    prov: 'Schüco Engineered',
    finish: 'Anodized Dark Bronze',
    thermal: 'U-Value 0.78 W/m²K',
    sustain: 'Cradle-to-Cradle Silver',
    camPos: [-3.8, 1.8, -1.0],
    camTarget: [-5.5, 1.8, -1.0]
  },
  {
    id: 'hs-bed',
    plan: 'villa',
    title: 'Bespoke Floating King Suite & Headboard',
    kicker: 'PRIVATE SANCTUARY // MASTER SUITE',
    pos: [3.2, 0.85, 2.2],
    narrative: 'Cantilevered platform bed in natural linen upholstery with integrated dimmable reading lights, acoustic fluted headboard paneling, and floating nightstands.',
    prov: 'Atelier Crafted',
    finish: 'Bouclé & Slatted Walnut',
    thermal: 'OEKO-TEX Organic Linen',
    sustain: 'Biodegradable Textiles',
    camPos: [1.8, 1.6, 1.6],
    camTarget: [3.2, 1.0, 2.2]
  },
  // Studio Hotspots
  {
    id: 'hs-murphy',
    plan: 'studio',
    title: 'Kinetic Counterbalanced Wall-Bed',
    kicker: 'TRANSFORMATIVE ARCHITECTURE // MICRO SUITE',
    pos: [2.4, 1.6, -0.8],
    narrative: 'Gas-piston motorized bed assembly that folds flush into architectural millwork, seamlessly converting the sleeping quarter into a morning executive workstation.',
    prov: 'Hafele Hardware Engine',
    finish: 'Light Natural Ash',
    thermal: 'High-Durability Pivot Mechanism',
    sustain: 'Optimized Micro-Living Footprint',
    camPos: [0.6, 1.8, 0.8],
    camTarget: [2.4, 1.4, -0.8]
  },
  {
    id: 'hs-studio-desk',
    plan: 'studio',
    title: 'Ergonomic Fold-Down Workstation',
    kicker: 'WORK INTEGRATION // 08:30 AM FOCUS',
    pos: [2.4, 0.9, 0.7],
    narrative: 'Dual-purpose cantilevered desk with integrated cable management, ambient task lighting, and acoustic fabric backdrop.',
    prov: 'Atelier Studio Custom',
    finish: 'Matte Linoleum & Oak',
    thermal: 'Anti-Static Work Surface',
    sustain: 'FSC Solid Timber Core',
    camPos: [1.2, 1.6, 1.2],
    camTarget: [2.4, 1.0, 0.7]
  },
  // Loft Hotspots
  {
    id: 'hs-column',
    plan: 'loft',
    title: 'Board-Formed Architectural Concrete Column',
    kicker: 'STRUCTURAL CORE // INDUSTRIAL LOFT',
    pos: [0, 1.9, 0],
    narrative: 'Exposed structural brutalist column showing raw timber grain formwork impressions, anchoring the open 63m² creative space.',
    prov: 'Cast-in-Place Structural',
    finish: 'Raw Board-Formed Micro-Plaster',
    thermal: 'Thermal Mass Inertia',
    sustain: 'Low-Carbon Slag Cement Mix',
    camPos: [-1.8, 1.8, 1.8],
    camTarget: [0, 1.8, 0]
  }
];

export const PROPS_META = {
  'med-drawers': {
    name: 'Artisan Mediterranean 3-Drawer Credenza',
    category: 'Storage & Credenza',
    material: 'Aged Cedar & Brushed Antique Brass',
    dimensions: '1.30m × 0.84m × 0.50m',
    hasDrawers: true,
    cost: 3450,
    style: 'mediterranean'
  },
  'table-dining': {
    name: 'Rustic Mediterranean Cedar Dining Table',
    category: 'Dining & Gathering',
    material: 'Solid Cedar Planks & Turned Architectural Legs',
    dimensions: '1.90m × 0.76m × 0.95m',
    cost: 4200,
    style: 'mediterranean'
  },
  'table-coffee': {
    name: 'Travertine Stone & Cedar Coffee Table',
    category: 'Living Salon',
    material: 'Honed Roman Travertine Stone Slab & Fluted Pedestals',
    dimensions: '1.18m × 0.38m × 0.68m',
    cost: 2650,
    style: 'mediterranean'
  },
  'chair-lounge': {
    name: 'Mediterranean Sun-Bleached Linen Armchair',
    category: 'Lounge Seating',
    material: 'Aged Timber Frame & Organic Oatmeal Linen',
    dimensions: '0.82m × 0.78m × 0.82m',
    cost: 1850,
    style: 'mediterranean'
  },
  'victorian-chair': {
    name: 'Bespoke Tufted Victorian Armchair',
    category: 'Lounge Seating',
    material: 'Ruby Velvet & Hand-Carved Baroque Walnut',
    dimensions: '0.85m × 0.98m × 0.85m',
    cost: 3200,
    style: 'european'
  },
  'chair-dining': {
    name: 'Artisan Mediterranean Dining Chair',
    category: 'Dining Seating',
    material: 'Turned Spindle Timber & Woven Rush Pad',
    dimensions: '0.52m × 0.88m × 0.52m',
    cost: 720,
    style: 'mediterranean'
  },
  'nightstand-drawer': {
    name: 'Mediterranean Bedside Drawer Table',
    category: 'Master Suite',
    material: 'Aged Cedar, Brass Ring Drop & Display Shelf',
    dimensions: '0.56m × 0.62m × 0.44m',
    hasDrawers: true,
    cost: 1250,
    style: 'mediterranean'
  },
  'prop-plant': {
    name: 'Mediterranean Potted Olive Tree',
    category: 'Biophilic Flora',
    material: 'Living Gnarled Olive Wood & Terracotta Urn',
    dimensions: '0.70m × 1.75m × 0.70m',
    cost: 980,
    style: 'mediterranean'
  },
  'prop-vase': {
    name: 'Handcrafted Terracotta Amphora Urn',
    category: 'Artisan Decor',
    material: 'Hand-Thrown Terracotta Clay with Loop Handles',
    dimensions: '0.44m × 0.58m × 0.38m',
    cost: 640,
    style: 'mediterranean'
  },
  'pouf-velvet': {
    name: 'Mediterranean Woven Linen Pouf',
    category: 'Ottoman',
    material: 'Sun-Bleached Organic Linen & Leather Detail',
    dimensions: '0.62m × 0.36m × 0.62m',
    cost: 480,
    style: 'mediterranean'
  },
  'crate-wood': {
    name: 'Timber Shipping Crate',
    category: 'Physics Cargo',
    material: 'Reinforced Pine & Stenciled Markings',
    dimensions: '0.55m × 0.55m × 0.55m',
    cost: 180,
    style: 'general'
  },
  'crate-industrial': {
    name: 'Industrial Steel Cargo Box',
    category: 'Physics Cargo',
    material: 'Galvanized Sheet Steel',
    dimensions: '0.50m × 0.50m × 0.50m',
    cost: 290,
    style: 'general'
  },
  'prop-cat': {
    name: 'Domestic Cat Sculpture / Companion',
    category: 'Living Accent',
    material: 'Glazed Ceramic & Ochre Finish',
    dimensions: '0.45m × 0.28m × 0.32m',
    cost: 320,
    style: 'general'
  },
  'bed-king': {
    name: 'Artisan Mediterranean Platform King Bed',
    category: 'Master Suite',
    material: 'Solid Cedar Platform, Fluted Linen Headboard & Brass Sconces',
    dimensions: '2.15m × 1.15m × 2.25m',
    cost: 5400,
    style: 'mediterranean'
  },
  'curtain-drape': {
    name: 'Bespoke Ripplefold Linen Drapery & Brass Rod',
    category: 'Architectural Drapery',
    material: 'Organic Oatmeal Linen, Sheer Gauze & Antique Brass Rod',
    dimensions: '3.60m × 2.90m × 0.18m',
    cost: 1650,
    style: 'mediterranean'
  }
};

export const INITIAL_MEDITERRANEAN_PROPS = [
  {
    id: 'med-tbl-dining-1',
    type: 'table-dining',
    name: 'Round Scandinavian Oak Dining Table',
    x: -3.8,
    y: 0.40,
    z: -1.0
  },
  {
    id: 'med-chair-din-1',
    type: 'chair-dining',
    name: 'Curved Dining Chair (Front)',
    x: -3.8,
    y: 0.46,
    z: -0.2
  },
  {
    id: 'med-chair-din-2',
    type: 'chair-dining',
    name: 'Curved Dining Chair (Back)',
    x: -3.8,
    y: 0.46,
    z: -1.8
  },
  {
    id: 'med-chair-din-3',
    type: 'chair-dining',
    name: 'Curved Dining Chair (Right)',
    x: -3.0,
    y: 0.46,
    z: -1.0
  },
  {
    id: 'med-chair-din-4',
    type: 'chair-dining',
    name: 'Curved Dining Chair (Window Left)',
    x: -4.5,
    y: 0.46,
    z: -0.6
  },
  {
    id: 'med-chair-din-5',
    type: 'chair-dining',
    name: 'Curved Dining Chair (Window Back)',
    x: -4.5,
    y: 0.46,
    z: -1.4
  },
  {
    id: 'med-tbl-coffee-1',
    type: 'table-coffee',
    name: 'Round Oak & Travertine Coffee Table',
    x: -0.6,
    y: 0.22,
    z: 0.0
  },
  {
    id: 'med-nightstand-1',
    type: 'nightstand-drawer',
    name: 'Master Suite Left Nightstand',
    x: 3.5,
    y: 0.34,
    z: 1.0
  },
  {
    id: 'med-nightstand-2',
    type: 'nightstand-drawer',
    name: 'Master Suite Right Nightstand',
    x: 3.5,
    y: 0.34,
    z: 3.2
  },
  {
    id: 'med-olive-tree-1',
    type: 'prop-plant',
    name: 'Indoor Fiddle-Leaf Fig Tree',
    x: -4.5,
    y: 0.90,
    z: -2.5
  },
  {
    id: 'med-amphora-1',
    type: 'prop-vase',
    name: 'Artisan Ceramic Pottery Vessel',
    x: 2.2,
    y: 0.60,
    z: -1.1
  }
];

// Universal BIM Structural Elements Metadata
export const STRUCTURAL_META = {
  'struct-floor': {
    name: 'Foundation & Floor Slab',
    category: 'Architecture / Floor Slab',
    material: 'Honed Roman Travertine & Lime Plinth',
    dimensions: '11.00m × 0.20m × 7.80m',
    isStructural: true,
    room: 'Entire House',
    cost: 14500
  },
  'struct-wall-back': {
    name: 'Exterior Back Limewash Wall',
    category: 'Architecture / Exterior Wall',
    material: 'Natural Limewash Plaster & Charcoal Edge Reveal',
    dimensions: '11.00m × 3.40m × 0.20m',
    isStructural: true,
    room: 'Perimeter',
    cost: 8200
  },
  'struct-wall-left': {
    name: 'Exterior Left Picture Window Wall',
    category: 'Architecture / Exterior Wall',
    material: 'Natural Limewash Plaster & Charcoal Baseboard',
    dimensions: '0.20m × 3.40m × 7.80m',
    isStructural: true,
    room: 'Perimeter',
    cost: 7600
  },
  'struct-partition-main': {
    name: 'Interior Suite Dividing Partition Wall',
    category: 'Architecture / Interior Partition',
    material: 'Solid Plaster Partition with Lintel Opening',
    dimensions: '0.20m × 3.40m × 3.60m',
    isStructural: true,
    room: 'Master Suite Divider',
    cost: 4800
  },
  'struct-window-main': {
    name: 'Architectural Picture Window Frame',
    category: 'Architecture / Glazed Opening',
    material: 'Charcoal Aluminum Frame, Low-E Glass & Stone Sill',
    dimensions: '3.65m × 2.40m × 0.12m',
    isStructural: true,
    room: 'Salon & Garden View',
    cost: 6500
  },
  'struct-island': {
    name: "Chef's Kitchen Marble & Fluted Cedar Island",
    category: 'Architecture / Fixed Joinery',
    material: 'Honed Calacatta Marble & Fluted Cedar Joinery',
    dimensions: '2.80m × 0.92m × 1.10m',
    isStructural: true,
    room: 'Chef Kitchen',
    cost: 12400
  },
  'struct-bed-master': {
    name: 'Built-in Master Bed & Upholstered Headboard',
    category: 'Architecture / Bedroom Suite',
    material: 'Mediterranean Cedar Plinth & Oatmeal Linen',
    dimensions: '2.20m × 1.10m × 2.10m',
    isStructural: true,
    room: 'Master Bedroom',
    cost: 5800
  }
};

// ArchiCAD 1:1 Room Zones and Area Measurements (Meters)
export const ROOM_ZONES = {
  villa: [
    {
      id: 'zone-living',
      name: 'Living Salon & Lounge',
      center: [-2.4, 0.0, 0.5],
      size: [5.8, 6.6],
      area: 38.3,
      ceilingHeight: 3.40,
      level: '±0.000 FFL',
      tag: 'ZONE 01 • SALON'
    },
    {
      id: 'zone-kitchen',
      name: 'Chef Kitchen & Dining',
      center: [2.8, 0.0, -2.1],
      size: [4.6, 3.4],
      area: 15.6,
      ceilingHeight: 3.40,
      level: '±0.000 FFL',
      tag: 'ZONE 02 • KITCHEN'
    },
    {
      id: 'zone-master',
      name: 'Master Suite & Sleeping Sanctuary',
      center: [2.8, 0.0, 1.8],
      size: [4.6, 4.0],
      area: 18.4,
      ceilingHeight: 3.40,
      level: '±0.000 FFL',
      tag: 'ZONE 03 • SUITE'
    },
    {
      id: 'zone-terrace',
      name: 'Cantilevered Sunset Terrace & Pool',
      center: [0.0, -0.4, 6.2],
      size: [11.0, 4.2],
      area: 46.2,
      ceilingHeight: 'Open Sky',
      level: '-0.380 FFL',
      tag: 'ZONE 04 • TERRACE'
    }
  ],
  studio: [
    {
      id: 'zone-living-micro',
      name: 'Multifunctional Micro Salon & Bed',
      center: [-1.2, 0.0, 0.0],
      size: [4.2, 5.0],
      area: 21.0,
      ceilingHeight: 3.00,
      level: '±0.000 FFL',
      tag: 'ZONE 01 • FLEX'
    },
    {
      id: 'zone-kitchen-micro',
      name: 'Compact Kitchenette & Bar',
      center: [2.0, 0.0, 0.0],
      size: [2.4, 5.0],
      area: 12.0,
      ceilingHeight: 3.00,
      level: '±0.000 FFL',
      tag: 'ZONE 02 • KITCHEN'
    }
  ],
  loft: [
    {
      id: 'zone-loft-open',
      name: 'Open Creative Gallery & Salon',
      center: [0.0, 0.0, 0.0],
      size: [9.0, 7.0],
      area: 63.0,
      ceilingHeight: 4.20,
      level: '±0.000 FFL',
      tag: 'ZONE 01 • OPEN LOFT'
    }
  ],
  urban2bed: [
    {
      id: 'zone-urban-salon',
      name: 'Central Living & Dining Loggia',
      center: [0.0, 0.0, -1.0],
      size: [5.2, 4.8],
      area: 25.0,
      ceilingHeight: 3.20,
      level: '±0.000 FFL',
      tag: 'ZONE 01 • SALON'
    },
    {
      id: 'zone-urban-suite-a',
      name: 'Primary Suite (King Bed)',
      center: [3.4, 0.0, 1.2],
      size: [3.2, 4.4],
      area: 14.1,
      ceilingHeight: 3.20,
      level: '±0.000 FFL',
      tag: 'ZONE 02 • MASTER'
    },
    {
      id: 'zone-urban-suite-b',
      name: 'Guest Suite & Creative Office',
      center: [-3.4, 0.0, 1.2],
      size: [3.2, 4.4],
      area: 14.1,
      ceilingHeight: 3.20,
      level: '±0.000 FFL',
      tag: 'ZONE 03 • GUEST'
    },
    {
      id: 'zone-urban-balcony',
      name: 'Panoramic Breakfast Balcony',
      center: [0.0, 0.0, 4.2],
      size: [6.0, 1.8],
      area: 10.8,
      ceilingHeight: 'Open Sky',
      level: '-0.150 FFL',
      tag: 'ZONE 04 • BALCONY'
    }
  ]
};


