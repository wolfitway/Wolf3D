import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  activeDrawerAtom,
  curtainStateAtom,
  spawnedPropsAtom,
  selectedPropIdAtom,
  styleThemeAtom,
  catalogRoomFilterAtom,
  isImageTo3dModalOpenAtom,
  customCatalogProductsAtom
} from '../../store/atoms';
import { physicsEngine } from '../../physics/physicsEngine';
import { playChime, playSnap } from '../../audio/audioSystem';
import { PROPS_META, INITIAL_MEDITERRANEAN_PROPS } from '../../data/constants';

const CATALOG_ITEMS = [
  {
    key: 'bed-king',
    room: 'bedroom',
    thumb: '🛏️',
    title: 'Artisan Platform King Bed',
    meta: 'Solid Cedar • Fluted Linen Headboard',
    dims: '2.15m × 1.15m × 2.25m',
    price: '$5,400',
    highlight: true
  },
  {
    key: 'curtain-drape',
    room: 'bedroom',
    thumb: '🪟',
    title: 'Ripplefold Linen Drapery',
    meta: 'Brass Rod & Finials • 3D Wave Pleats',
    dims: '3.60m × 2.90m × 0.18m',
    price: '$1,650',
    highlight: true
  },
  {
    key: 'med-drawers',
    room: 'living',
    thumb: '🏺',
    title: 'Artisan 3-Drawer Credenza',
    meta: 'Aged Cedar • Functional Pull Drawers',
    dims: '1.30m × 0.84m × 0.50m',
    price: '$3,450',
    highlight: true
  },
  {
    key: 'table-dining',
    room: 'kitchen',
    thumb: '🪵',
    title: 'Rustic Cedar Dining Table',
    meta: 'Solid Slab • Turned Legs & Stretcher',
    dims: '1.90m × 0.76m × 0.95m',
    price: '$4,200',
    highlight: true
  },
  {
    key: 'table-coffee',
    room: 'living',
    thumb: '☕',
    title: 'Travertine Stone Coffee Table',
    meta: 'Honed Limestone • Fluted Pedestal Base',
    dims: '1.18m × 0.38m × 0.68m',
    price: '$2,650',
    highlight: true
  },
  {
    key: 'chair-lounge',
    room: 'living',
    thumb: '🪑',
    title: 'Mediterranean Linen Armchair',
    meta: 'Aged Wood Frame • Oatmeal Linen Cushion',
    dims: '0.82m × 0.78m × 0.82m',
    price: '$1,850',
    highlight: true
  },
  {
    key: 'chair-dining',
    room: 'kitchen',
    thumb: '🪑',
    title: 'Artisan Dining Chair',
    meta: 'Turned Spindles • Woven Rush Pad',
    dims: '0.52m × 0.88m × 0.52m',
    price: '$720',
    highlight: true
  },
  {
    key: 'nightstand-drawer',
    room: 'bedroom',
    thumb: '🛏️',
    title: 'Bedside Drawer Nightstand',
    meta: 'Cedar Table • Slide Drawer & Lower Shelf',
    dims: '0.56m × 0.62m × 0.44m',
    price: '$1,250',
    highlight: true
  },
  {
    key: 'pouf-velvet',
    room: 'living',
    thumb: '🛋️',
    title: 'Mediterranean Linen Pouf',
    meta: 'Sun-Bleached Organic Linen Cushion',
    dims: '0.62m × 0.36m × 0.62m',
    price: '$480',
    highlight: true
  },
  {
    key: 'prop-plant',
    room: 'terrace',
    thumb: '🪴',
    title: 'Potted Mediterranean Olive Tree',
    meta: '1.75m Flora • Ribbed Terracotta Urn',
    dims: '0.70m × 1.75m × 0.70m',
    price: '$980',
    highlight: true
  },
  {
    key: 'prop-vase',
    room: 'terrace',
    thumb: '🏺',
    title: 'Handcrafted Terracotta Amphora',
    meta: 'Greek Loop Handles • Hand-Thrown Clay',
    dims: '0.44m × 0.58m × 0.38m',
    price: '$640',
    highlight: true
  },
  {
    key: 'crate-wood',
    room: 'terrace',
    thumb: '📦',
    title: 'Timber Shipping Crate',
    meta: '18 kg • Rapier WASM Physics Body',
    dims: '0.55m × 0.55m × 0.55m',
    price: '$180',
    highlight: false
  },
  {
    key: 'crate-industrial',
    room: 'terrace',
    thumb: '🧰',
    title: 'Industrial Steel Cargo Box',
    meta: '32 kg • Heavy Rigid Body',
    dims: '0.50m × 0.50m × 0.50m',
    price: '$290',
    highlight: false
  },
  {
    key: 'prop-cat',
    room: 'living',
    thumb: '🐈',
    title: 'Domestic Companion Sculpture',
    meta: 'Ochre Terracotta • 4.2 kg Ceramic',
    dims: '0.45m × 0.28m × 0.32m',
    price: '$320',
    highlight: false
  }
];

export default function CatalogDrawer() {
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);
  const [curtainState, setCurtainState] = useAtom(curtainStateAtom);
  const [spawnedProps, setSpawnedProps] = useAtom(spawnedPropsAtom);
  const setSelectedPropId = useSetAtom(selectedPropIdAtom);
  const setStyleTheme = useSetAtom(styleThemeAtom);
  const [roomFilter, setRoomFilter] = useAtom(catalogRoomFilterAtom);
  const setIsImageTo3dModalOpen = useSetAtom(isImageTo3dModalOpenAtom);
  const [customProducts, setCustomProducts] = useAtom(customCatalogProductsAtom);

  const isOpen = activeDrawer === 'catalog';

  const handleSpawnCustom = (item) => {
    const id = `custom-spawn-${Date.now()}`;
    const x = (Math.random() - 0.5) * 1.5;
    const halfH = item.dimensions?.height ? item.dimensions.height / 2 : 0.4;
    const y = halfH + 0.15;
    const z = (Math.random() - 0.5) * 1.5;

    physicsEngine.registerDimensions(item.key, item.dimensions.width, item.dimensions.height, item.dimensions.depth);
    const record = physicsEngine.createBody(id, item.key, x, y, z);
    if (record) {
      setSpawnedProps(prev => [
        ...prev,
        {
          id,
          type: item.key,
          name: item.title,
          category: item.category,
          dimensions: item.dimensions,
          dimensionsText: item.dims,
          fabric: item.fabric,
          wood: item.wood,
          imageUrl: item.imageUrl,
          isCustomImage: true,
          x,
          y,
          z
        }
      ]);
      setSelectedPropId(id);
      playChime(784);
      playSnap();
    }
  };

  const handleSpawn = (type) => {
    const id = `prop-${Date.now()}`;
    const x = (Math.random() - 0.5) * 2.5;
    const halfH = physicsEngine.getHalfHeight(type);
    const y = halfH + 0.5;
    const z = (Math.random() - 0.5) * 2.5;

    const record = physicsEngine.createBody(id, type, x, y, z);
    if (record) {
      const meta = PROPS_META[type] || {};
      const name = meta.name || 'Architectural Prop';
      setSpawnedProps(prev => [...prev, { id, type, name, x, y, z }]);
      setSelectedPropId(id);
      playChime(660);
    }
  };

  const handleStageMediterraneanSuite = () => {
    // Clear old physics
    physicsEngine.clear();

    // Stage Mediterranean pieces
    const stagedList = [];
    INITIAL_MEDITERRANEAN_PROPS.forEach(p => {
      const halfH = physicsEngine.getHalfHeight(p.type);
      const safeY = halfH + 0.04;
      const record = physicsEngine.createBody(p.id, p.type, p.x, safeY, p.z);
      if (record) {
        stagedList.push({ ...p, y: safeY });
      }
    });

    setSpawnedProps(stagedList);
    setStyleTheme('mediterranean');
    if (stagedList.length > 0) {
      setSelectedPropId(stagedList[0].id);
    }
    playChime(784);
    playSnap();
  };

  const filteredItems = CATALOG_ITEMS.filter(item => {
    if (roomFilter === 'all') return true;
    return item.room === roomFilter;
  });

  return (
    <div className={`panel-drawer right-drawer ${isOpen ? 'open' : ''}`} id="catalog-drawer">
      <div className="drawer-header">
        <div className="drawer-title-group">
          <h3>Architectural Furniture Catalog</h3>
          <span className="drawer-subhead">1:1 Metric Calibration & Room-by-Room Decorator</span>
        </div>
        <button className="close-btn" id="close-catalog-btn" onClick={() => setActiveDrawer(null)}>
          &times;
        </button>
      </div>

      <div className="drawer-body">
        {/* VIP One-Click Mediterranean Staging Action */}
        <div className="catalog-featured-card">
          <div className="featured-badge">VIP CLIENT SHOWROOM PRESET</div>
          <div className="featured-content">
            <h4>🏛️ Stage Mediterranean Villa Suite</h4>
            <p>
              Instantly furnish the room with authentic cedar dining table, 3-tier credenza with functioning drawers,
              travertine stone coffee table, linen armchairs, bedside nightstand, olive trees, and terracotta amphoras.
            </p>
            <button
              className="featured-stage-btn"
              id="stage-mediterranean-suite-btn"
              onClick={handleStageMediterraneanSuite}
            >
              <span>✨</span>
              <span>Load Full Mediterranean Room Layout</span>
            </button>
          </div>
        </div>

        {/* Photo to 3D AI Generator Card */}
        <div className="catalog-photo-to-3d-card">
          <div className="photo-to-3d-badge">CUSTOM PHOTO TO 3D GENERATOR</div>
          <div className="photo-to-3d-content">
            <div className="photo-to-3d-header">
              <h4>📸 Upload Any Photo & Generate 3D Model</h4>
              <span className="photo-scale-tag">1:1 Metric Scale</span>
            </div>
            <p>
              Upload any image of furniture, art, fireplaces, or decor (or pick from the luxury reference villa presets).
              Our volumetric generator creates an exact 3D model ready to place and position anywhere in the room.
            </p>
            <button
              className="open-photo-to-3d-btn"
              id="catalog-open-photo-to-3d-btn"
              onClick={() => setIsImageTo3dModalOpen(true)}
            >
              <span>📷</span>
              <span>Upload Photo & Generate 3D Model</span>
            </button>
          </div>
        </div>

        {/* Room-by-Room Filter Ribbon */}
        <div className="catalog-room-tabs-container">
          <span className="room-tabs-label">Filter Decorator by Room:</span>
          <div className="catalog-room-tabs">
            {[
              { id: 'all', label: 'All Items', icon: '🌐' },
              { id: 'living', label: 'Living Salon', icon: '🛋️' },
              { id: 'kitchen', label: 'Kitchen & Dining', icon: '🍳' },
              { id: 'bedroom', label: 'Master Suite', icon: '🛏️' },
              { id: 'terrace', label: 'Terrace & Decor', icon: '🌿' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`room-filter-tab ${roomFilter === tab.id ? 'active' : ''}`}
                id={`catalog-filter-${tab.id}`}
                onClick={() => { setRoomFilter(tab.id); playSnap(); }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="catalog-hint">
          Every piece has strict 1:1 real-world metric dimensions. Click to place into the 3D room, then grab `[G]` or rotate `[R]`.
        </p>

        {/* Custom Generated Products from Photos */}
        {customProducts.length > 0 && (
          <div className="catalog-section custom-products-shelf" id="custom-products-shelf">
            <div className="section-title-badge">
              <span className="badge-tag gold-badge">✨ CUSTOM 3D PRODUCTS</span>
              <h4>Your Photo-to-3D Collection ({customProducts.filter(p => roomFilter === 'all' || p.room === roomFilter).length})</h4>
            </div>
            <div className="catalog-grid">
              {customProducts
                .filter(p => roomFilter === 'all' || p.room === roomFilter)
                .map(item => (
                  <button
                    key={item.key}
                    className="catalog-card custom-product-card highlight-card"
                    id={`spawn-${item.key}`}
                    onClick={() => handleSpawnCustom(item)}
                  >
                    <div className="card-thumb">{item.thumb}</div>
                    <div className="card-title">{item.title}</div>
                    <div className="card-dims-badge">↔ {item.dims}</div>
                    <div className="card-meta">{item.meta} &bull; <strong>{item.price}</strong></div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Filtered Dynamic Items Grid */}
        <div className="catalog-section">
          <div className="section-title-badge">
            <span className="badge-tag">1:1 REAL-WORLD SCALE</span>
            <h4>{roomFilter === 'all' ? 'All Architectural Furnishings' : `${roomFilter.toUpperCase()} COLLECTION`}</h4>
          </div>

          <div className="catalog-grid">
            {filteredItems.map(item => (
              <button
                key={item.key}
                className={`catalog-card ${item.highlight ? 'highlight-card' : ''}`}
                id={`spawn-${item.key}`}
                onClick={() => handleSpawn(item.key)}
              >
                <div className="card-thumb">{item.thumb}</div>
                <div className="card-title">{item.title}</div>
                <div className="card-dims-badge">↔ {item.dims}</div>
                <div className="card-meta">{item.meta} &bull; <strong>{item.price}</strong></div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Physics Cargo & Modular Elements */}
        <div className="catalog-section">
          <h4>Modular Physics & Accessories</h4>
          <div className="catalog-grid">
            <button className="catalog-card" onClick={() => handleSpawn('crate-wood')}>
              <div className="card-thumb">📦</div>
              <div className="card-title">Timber Shipping Crate</div>
              <div className="card-meta">0.55m &bull; 18 kg &bull; $180</div>
            </button>
            <button className="catalog-card" onClick={() => handleSpawn('crate-industrial')}>
              <div className="card-thumb">🧰</div>
              <div className="card-title">Industrial Steel Cargo Box</div>
              <div className="card-meta">0.5m &bull; 32 kg &bull; $290</div>
            </button>
            <button className="catalog-card" onClick={() => handleSpawn('prop-cat')}>
              <div className="card-thumb">🐈</div>
              <div className="card-title">Domestic Pet Sculpture</div>
              <div className="card-meta">Ochre Terracotta &bull; 4.2 kg &bull; $320</div>
            </button>
          </div>
        </div>

        {/* 3. Drapery & Curtain Controls */}
        <div className="catalog-section">
          <h4>Architectural Drapery Controls</h4>
          <div className="curtain-ctrl-row">
            <span>Drapery State:</span>
            <div className="pill-group">
              <button
                className={`pill-btn ${curtainState === 'sheer' ? 'active' : ''}`}
                id="curtain-sheer"
                onClick={() => setCurtainState('sheer')}
              >
                Sheer Gauze
              </button>
              <button
                className={`pill-btn ${curtainState === 'velvet' ? 'active' : ''}`}
                id="curtain-velvet"
                onClick={() => setCurtainState('velvet')}
              >
                Rich Velvet
              </button>
              <button
                className={`pill-btn ${curtainState === 'shoji' ? 'active' : ''}`}
                id="curtain-shoji"
                onClick={() => setCurtainState('shoji')}
              >
                Shoji Screen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
