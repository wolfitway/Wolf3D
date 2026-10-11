import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

const gltfLoader = new GLTFLoader();
const glbCache = new Map();
const pendingCallbacks = new Map();

export const GLB_MODEL_MAP = {
  // Lounge & Seating
  'chair-lounge': '/models/chair_lounge.glb',
  'med-chair-lounge': '/models/chair_lounge.glb',
  'victorian-chair': '/models/generated/victorian_chair.glb',
  'custom-armchair': '/models/generated/victorian_chair.glb',
  'pouf-velvet': '/models/pouf_velvet.glb',
  'med-pouf': '/models/pouf_velvet.glb',
  'chair-dining': '/models/chair_dining.glb',
  'med-chair-dining': '/models/chair_dining.glb',

  // Tables
  'table-coffee': '/models/table_coffee.glb',
  'med-coffee-table': '/models/table_coffee.glb',
  'table-dining': '/models/table_dining.glb',
  'med-dining-table': '/models/table_dining.glb',

  // Storage & Nightstands
  'med-drawers': '/models/med_drawers.glb',
  'drawers': '/models/med_drawers.glb',
  'nightstand-drawer': '/models/nightstand_drawer.glb',
  'med-nightstand': '/models/nightstand_drawer.glb',

  // Bed
  'bed-king': '/models/bed_king.glb',
  'med-bed': '/models/bed_king.glb',
  'bed': '/models/bed_king.glb',

  // Decor & Flora
  'prop-plant': '/models/prop_plant.glb',
  'med-olive-tree': '/models/prop_plant.glb',
  'prop-vase': '/models/prop_vase.glb',
  'med-amphora': '/models/prop_vase.glb',
  'prop-cat': '/models/prop_cat.glb',

  // Cargo & Physics
  'crate-wood': '/models/crate_wood.glb',
  'crate-industrial': '/models/crate_industrial.glb',

  // Architectural Features
  'sofa-sectional': '/models/sofa_sectional.glb',
  'kitchen-island': '/models/kitchen_island.glb'
};

/**
 * Preload all GLB models into memory on startup
 */
export function preloadAllGlbModels() {
  const uniqueUrls = new Set(Object.values(GLB_MODEL_MAP));
  uniqueUrls.forEach(url => {
    if (!glbCache.has(url)) {
      gltfLoader.load(
        url,
        (gltf) => {
          gltf.scene.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          glbCache.set(url, gltf.scene);

          // Flush any pending callbacks waiting for this model
          if (pendingCallbacks.has(url)) {
            const cbs = pendingCallbacks.get(url);
            cbs.forEach(cb => cb(gltf.scene));
            pendingCallbacks.delete(url);
          }
        },
        undefined,
        (err) => {
          console.warn(`[GLB Loader] Failed to load ${url}:`, err);
        }
      );
    }
  });
}

// Automatically initiate background preloading
preloadAllGlbModels();

/**
 * Clone a cached GLTF scene and bind interaction logic
 */
function cloneAndSetupModel(originalScene, type, rootGroup) {
  const clone = originalScene.clone(true);

  // Traverse to ensure shadows and raycast targeting
  clone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.rootProp = rootGroup;
      if (rootGroup.userData.propId) {
        child.userData.propId = rootGroup.userData.propId;
      }
    }
  });

  // Setup Drawer Animation if applicable
  if (type === 'med-drawers' || type === 'drawers') {
    let areDrawersOpen = false;
    rootGroup.userData.hasDrawers = true;
    rootGroup.userData.areDrawersOpen = () => areDrawersOpen;
    rootGroup.userData.toggleDrawers = (targetOpen = null) => {
      areDrawersOpen = (targetOpen !== null) ? targetOpen : !areDrawersOpen;
      const drawerGroups = [];
      clone.traverse(child => {
        if (child.name && child.name.startsWith('DrawerGroup_')) {
          drawerGroups.push(child);
        }
      });
      drawerGroups.sort((a, b) => a.name.localeCompare(b.name));
      drawerGroups.forEach((dg, i) => {
        const targetZ = areDrawersOpen ? -(0.24 - i * 0.06) : 0;
        gsap.to(dg.position, {
          y: targetZ, // in Blender Y was depth; when exported with Yup, Blender Y is forward/backward
          duration: 0.65 + i * 0.08,
          ease: 'power2.out'
        });
      });
      return areDrawersOpen;
    };
  } else if (type === 'nightstand-drawer' || type === 'med-nightstand') {
    let isNightstandOpen = false;
    rootGroup.userData.hasDrawers = true;
    rootGroup.userData.areDrawersOpen = () => isNightstandOpen;
    rootGroup.userData.toggleDrawers = (targetOpen = null) => {
      isNightstandOpen = (targetOpen !== null) ? targetOpen : !isNightstandOpen;
      clone.traverse(child => {
        if (child.name === 'NightstandDrawerGroup') {
          const targetZ = isNightstandOpen ? -0.16 : 0;
          gsap.to(child.position, {
            y: targetZ,
            duration: 0.6,
            ease: 'power2.out'
          });
        }
      });
      return isNightstandOpen;
    };
  }

  return clone;
}

/**
 * Creates a furniture prop group powered by the real Blender GLB model.
 * If cached, the model is mounted synchronously.
 * If still fetching, mounts a placeholder and seamlessly swaps when loaded.
 */
export function createGlbFurnitureModel(type, fallbackFactory = null) {
  const url = GLB_MODEL_MAP[type];
  const root = new THREE.Group();
  root.name = `GLB_${type}`;

  if (!url) {
    if (fallbackFactory) return fallbackFactory();
    return root;
  }

  if (glbCache.has(url)) {
    const model = cloneAndSetupModel(glbCache.get(url), type, root);
    root.add(model);
  } else {
    // If fallback factory provided, mount it while waiting
    let placeholder = null;
    if (fallbackFactory) {
      placeholder = fallbackFactory();
      root.add(placeholder);
    }

    const onLoaded = (scene) => {
      if (placeholder && placeholder.parent === root) {
        root.remove(placeholder);
      }
      const model = cloneAndSetupModel(scene, type, root);
      root.add(model);
    };

    if (!pendingCallbacks.has(url)) {
      pendingCallbacks.set(url, []);
    }
    pendingCallbacks.get(url).push(onLoaded);

    // If not yet loading, start loading
    if (!glbCache.has(url)) {
      gltfLoader.load(
        url,
        (gltf) => {
          gltf.scene.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          glbCache.set(url, gltf.scene);
          if (pendingCallbacks.has(url)) {
            const cbs = pendingCallbacks.get(url);
            cbs.forEach(cb => cb(gltf.scene));
            pendingCallbacks.delete(url);
          }
        },
        undefined,
        (err) => {
          console.warn(`[GLB Loader] Error loading ${url}:`, err);
        }
      );
    }
  }

  return root;
}
