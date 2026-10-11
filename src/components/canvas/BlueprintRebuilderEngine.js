/**
 * BlueprintRebuilderEngine.js
 * 
 * Reconstructs complete 3D houses & room-by-room interiors directly from 2D floor plans.
 * Supports parametric 1:1 real-world metric scaling, structural entity generation,
 * and automated interior furniture staging.
 */

export const PRESET_2D_PLANS = {
  villa: {
    id: 'villa',
    name: 'Villa Lumina Residence',
    subtitle: 'Bespoke 3-Room Estate with Sunset Pool',
    area: '85.8',
    dimensions: { width: 11.0, depth: 7.8, height: 3.4 },
    rooms: [
      { id: 'living', name: 'Living Salon & Lounge', center: [-2.4, 0.0, 0.5], size: [5.8, 6.6], area: 38.3, level: '±0.000 FFL', ceiling: '3.40m' },
      { id: 'kitchen', name: 'Chef Kitchen & Dining', center: [2.8, 0.0, -2.1], size: [4.6, 3.4], area: 15.6, level: '±0.000 FFL', ceiling: '3.40m' },
      { id: 'master', name: 'Master Suite & Sanctuary', center: [2.8, 0.0, 1.8], size: [4.6, 4.0], area: 18.4, level: '±0.000 FFL', ceiling: '3.40m' },
      { id: 'terrace', name: 'Cantilevered Sunset Terrace', center: [0.0, -0.4, 6.2], size: [11.0, 4.2], area: 46.2, level: '-0.380 FFL', ceiling: 'Open Sky' }
    ],
    wallCount: 4,
    doorsCount: 2,
    defaultStyle: 'mediterranean',
    description: 'Generous architectural open floor plan featuring limestone fireplace, travertine waterfall island, and private master bedroom sanctuary.'
  },
  studio: {
    id: 'studio',
    name: 'Adaptive Micro-Studio',
    subtitle: 'Modular Urban Living with Foldaway Joinery',
    area: '35.4',
    dimensions: { width: 6.8, depth: 5.2, height: 3.0 },
    rooms: [
      { id: 'flex', name: 'Multifunctional Micro Salon & Bed', center: [-1.2, 0.0, 0.0], size: [4.2, 5.0], area: 21.0, level: '±0.000 FFL', ceiling: '3.00m' },
      { id: 'kitchenette', name: 'Compact Bar & Kitchenette', center: [2.0, 0.0, 0.0], size: [2.4, 5.0], area: 12.0, level: '±0.000 FFL', ceiling: '3.00m' }
    ],
    wallCount: 3,
    doorsCount: 1,
    defaultStyle: 'scandi',
    description: 'Efficient micro-apartment engineered with foldaway murphy bed, concealed work desk, and compact acoustic divider partitions.'
  },
  loft: {
    id: 'loft',
    name: 'Open Industrial Loft',
    subtitle: 'Creative High-Ceiling Gallery & Living Space',
    area: '63.0',
    dimensions: { width: 9.0, depth: 7.0, height: 4.2 },
    rooms: [
      { id: 'open-loft', name: 'Open Creative Gallery & Salon', center: [0.0, 0.0, 0.0], size: [9.0, 7.0], area: 63.0, level: '±0.000 FFL', ceiling: '4.20m' }
    ],
    wallCount: 2,
    doorsCount: 1,
    defaultStyle: 'european',
    description: 'Expansive open plan with 4.2m soaring ceilings, industrial exposed brick and blackened steel joinery.'
  },
  urban2bed: {
    id: 'urban2bed',
    name: 'Modern 2-Bedroom Urban Apartment',
    subtitle: 'Dual Suite Layout with Central Dining Loggia',
    area: '72.0',
    dimensions: { width: 10.0, depth: 7.2, height: 3.2 },
    rooms: [
      { id: 'salon', name: 'Central Living & Dining Loggia', center: [0.0, 0.0, -1.0], size: [5.2, 4.8], area: 25.0, level: '±0.000 FFL', ceiling: '3.20m' },
      { id: 'suite-a', name: 'Primary Suite (King Bed)', center: [3.4, 0.0, 1.2], size: [3.2, 4.4], area: 14.1, level: '±0.000 FFL', ceiling: '3.20m' },
      { id: 'suite-b', name: 'Guest Suite & Creative Office', center: [-3.4, 0.0, 1.2], size: [3.2, 4.4], area: 14.1, level: '±0.000 FFL', ceiling: '3.20m' },
      { id: 'balcony', name: 'Panoramic Breakfast Balcony', center: [0.0, 0.0, 4.2], size: [6.0, 1.8], area: 10.8, level: '-0.150 FFL', ceiling: 'Open Sky' }
    ],
    wallCount: 5,
    doorsCount: 3,
    defaultStyle: 'japandi',
    description: 'Symmetrical 2-bedroom design with central entertaining hub, private dual suites, and floor-to-ceiling balcony glazing.'
  }
};

/**
 * Parses user-provided 2D plan JSON string or structured plan object
 */
export function parse2DPlanJson(jsonInput) {
  try {
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
    if (!data.dimensions || !data.dimensions.width || !data.dimensions.depth) {
      throw new Error('Plan must contain dimensions with width and depth in meters.');
    }
    const width = parseFloat(data.dimensions.width);
    const depth = parseFloat(data.dimensions.depth);
    const height = parseFloat(data.dimensions.height || 3.2);

    return {
      success: true,
      plan: {
        id: data.id || `custom-${Date.now()}`,
        name: data.name || 'Custom Rebuilt Residence',
        subtitle: data.subtitle || 'Generated from 2D Floor Plan Specification',
        area: (width * depth).toFixed(1),
        dimensions: { width, depth, height },
        rooms: data.rooms || [
          { id: 'room-1', name: 'Main Living Salon', center: [0, 0, 0], size: [width * 0.8, depth * 0.8], area: (width * depth * 0.7).toFixed(1), level: '±0.000 FFL', ceiling: `${height.toFixed(2)}m` }
        ],
        description: data.description || 'Parametrically extruded 3D room structure based on 2D vector boundaries.'
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
