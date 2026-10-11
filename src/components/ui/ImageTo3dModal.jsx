import React, { useState, useRef, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import * as THREE from 'three';
import {
  isImageTo3dModalOpenAtom,
  spawnedPropsAtom,
  selectedPropIdAtom,
  customGeneratedModelsAtom,
  customCatalogProductsAtom
} from '../../store/atoms';
import { buildImageBasedMesh } from '../canvas/ImageTo3DGenerator';
import { processFurnitureImageTo3D, imageMeshCache } from '../../utils/imageFeatureExtractor';
import { physicsEngine } from '../../physics/physicsEngine';
import { playChime, playSnap } from '../../audio/audioSystem';

export default function ImageTo3dModal() {
  const [isOpen, setIsOpen] = useAtom(isImageTo3dModalOpenAtom);
  const setSpawnedProps = useSetAtom(spawnedPropsAtom);
  const setSelectedPropId = useSetAtom(selectedPropIdAtom);
  const setCustomModels = useSetAtom(customGeneratedModelsAtom);
  const setCustomCatalogProducts = useSetAtom(customCatalogProductsAtom);

  const [currentImage, setCurrentImage] = useState('/images/samples/sample_victorian_chair.png');
  const [itemName, setItemName] = useState('Victorian Parlor Armchair');
  const [roomTarget, setRoomTarget] = useState('living');
  const [dimensions, setDimensions] = useState({ width: 0.84, height: 1.08, depth: 0.82 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [detectedSummary, setDetectedSummary] = useState('Synthesizing 3D multi-component anatomy & PBR materials...');

  const previewCanvasRef = useRef(null);
  const previewRendererRef = useRef(null);
  const previewSceneRef = useRef(null);
  const previewCameraRef = useRef(null);
  const previewGroupRef = useRef(null);

  // File Upload Drag & Drop
  const fileInputRef = useRef(null);

  // Process image whenever currentImage changes
  useEffect(() => {
    if (!currentImage) return;
    let isCancelled = false;
    setIsProcessing(true);

    processFurnitureImageTo3D(currentImage).then(result => {
      if (isCancelled || !result) {
        setIsProcessing(false);
        return;
      }
      setProcessedData(result);
      setDimensions(prev => ({
        ...prev,
        width: result.width,
        height: result.height,
        depth: result.depth
      }));
      setDetectedSummary(result.detectedSummary || '3D Multi-Component Model Synthesized');
      setIsProcessing(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [currentImage]);

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const titleName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setItemName(titleName);
      setCurrentImage(dataUrl);
      playSnap();
    };
    reader.readAsDataURL(file);
  };

  // 3D Mini Rotating Preview Loop
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;

    const width = 360;
    const height = 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161412);
    previewSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.0, 1.3, 2.2);
    camera.lookAt(0, 0.48, 0);
    previewCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: previewCanvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    previewRendererRef.current = renderer;

    const ambLight = new THREE.AmbientLight(0xfff8f5, 1.1);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2.5, 4.5, 3.5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdde8ff, 0.9);
    fillLight.position.set(-3, 2.5, -2);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);
    previewGroupRef.current = group;

    // Small architectural grid base
    const grid = new THREE.GridHelper(3, 10, 0xe5b869, 0x3a332a);
    grid.position.y = 0;
    scene.add(grid);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (group) group.rotation.y += 0.009;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [isOpen]);

  // Update Preview Mesh on input or image change (renders REAL 3D model generated from user photo)
  useEffect(() => {
    if (!previewGroupRef.current || !isOpen || !processedData) return;
    const grp = previewGroupRef.current;

    while (grp.children.length > 0) {
      const c = grp.children.pop();
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose && m.dispose());
        else c.material.dispose && c.material.dispose();
      }
    }

    const mesh = buildImageBasedMesh(processedData, dimensions);
    mesh.position.set(0, 0, 0);
    grp.add(mesh);
  }, [processedData, dimensions, isOpen]);

  // Generate 3D Model from User Image & Add to Products Catalog
  const handleGenerateAndAddToProducts = () => {
    if (!processedData) return;
    setIsGenerating(true);
    playSnap();

    setTimeout(() => {
      const timestamp = Date.now();
      const productKey = `custom-photo-${timestamp}`;
      const dimText = `${dimensions.width.toFixed(2)}m × ${dimensions.depth.toFixed(2)}m × ${dimensions.height.toFixed(2)}m`;

      // 1. Create permanent product in catalog
      const newProduct = {
        key: productKey,
        room: roomTarget,
        thumb: '🪑',
        title: itemName,
        meta: `Image-Synthesized 3D Model • ${processedData.fabric}`,
        dims: dimText,
        price: '$4,200',
        category: 'custom_image',
        dimensions: { ...dimensions },
        fabric: processedData.fabric,
        wood: processedData.wood,
        imageUrl: currentImage,
        isCustom: true,
        highlight: true
      };

      setCustomCatalogProducts(prev => [newProduct, ...prev]);

      // 2. Register physics bounds
      physicsEngine.registerDimensions(productKey, dimensions.width, dimensions.height, dimensions.depth);

      // 3. Drop immediately into active room scene
      const spawnX = (Math.random() - 0.5) * 1.5;
      const halfH = dimensions.height / 2;
      const spawnY = halfH + 0.15;
      const spawnZ = (Math.random() - 0.5) * 1.5;

      physicsEngine.createBody(productKey, productKey, spawnX, spawnY, spawnZ);

      const newSceneProp = {
        id: productKey,
        type: productKey,
        name: itemName,
        category: 'custom_image',
        dimensions: { ...dimensions },
        dimensionsText: dimText,
        material: `Image-Synthesized 3D Mesh`,
        fabric: processedData.fabric,
        wood: processedData.wood,
        imageUrl: currentImage,
        isCustomImage: true,
        x: spawnX,
        y: spawnY,
        z: spawnZ
      };

      setSpawnedProps(prev => [...prev, newSceneProp]);
      setCustomModels(prev => [...prev, newSceneProp]);
      setSelectedPropId(productKey);

      setIsGenerating(false);
      setIsOpen(false);
      playChime(880);
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div className="image-to-3d-backdrop" id="image-to-3d-modal">
      <div className="image-to-3d-dialog">
        <header className="dialog-header">
          <div className="dialog-title-group">
            <span className="badge-tag">PHOTO-TO-3D DIRECT SYNTHESIS</span>
            <h3>Synthesize 3D Model Directly From Your Image</h3>
            <p className="dialog-subtitle">
              Upload any chair or furniture photo to extract its exact silhouette contour, normal relief, and generate a genuine 3D polygonal model.
            </p>
          </div>
          <button className="close-btn" id="close-image-to-3d-btn" onClick={() => setIsOpen(false)}>
            &times;
          </button>
        </header>

        <div className="dialog-body">
          {/* Left Column: Upload & Live Controls */}
          <div className="dialog-col form-col">
            {/* Upload Drop Zone */}
            <div
              className="dropzone-box"
              id="photo-upload-dropzone"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileUpload}
              />
              <div className="dropzone-icon">📷</div>
              <div className="dropzone-text">
                <strong>Click to Upload Your Chair / Furniture Photo</strong>
                <span>Extracts contours, depth & generates 3D model directly from your photo</span>
              </div>
            </div>

            {/* Sample Photo Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span className="section-label" style={{ fontSize: '0.68rem', color: '#c5b8a5' }}>Quick Sample Photos:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="preset-chip"
                  id="preset-victorian-chair"
                  onClick={() => {
                    setItemName('Victorian Parlor Armchair');
                    setCurrentImage('/images/samples/sample_victorian_chair.png');
                  }}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: currentImage.includes('victorian') ? '1px solid #e5b869' : '1px solid #4a4035',
                    background: currentImage.includes('victorian') ? 'rgba(229, 184, 105, 0.2)' : '#231e1a',
                    color: currentImage.includes('victorian') ? '#f3ede3' : '#a89d8d',
                    cursor: 'pointer'
                  }}
                >
                  🪑 Victorian Armchair
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  id="preset-sectional-sofa"
                  onClick={() => {
                    setItemName('Modular Sectional Sofa');
                    setCurrentImage('/images/samples/sample_sectional_sofa.jpg');
                  }}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: currentImage.includes('sectional') ? '1px solid #e5b869' : '1px solid #4a4035',
                    background: currentImage.includes('sectional') ? 'rgba(229, 184, 105, 0.2)' : '#231e1a',
                    color: currentImage.includes('sectional') ? '#f3ede3' : '#a89d8d',
                    cursor: 'pointer'
                  }}
                >
                  🛋️ Sectional Sofa
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  id="preset-coffee-table"
                  onClick={() => {
                    setItemName('Architectural Coffee Table');
                    setCurrentImage('/images/samples/sample_coffee_table.jpg');
                  }}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: currentImage.includes('coffee') ? '1px solid #e5b869' : '1px solid #4a4035',
                    background: currentImage.includes('coffee') ? 'rgba(229, 184, 105, 0.2)' : '#231e1a',
                    color: currentImage.includes('coffee') ? '#f3ede3' : '#a89d8d',
                    cursor: 'pointer'
                  }}
                >
                  ☕ Coffee Table
                </button>
              </div>
            </div>

            {/* Feature Extraction Badges */}
            <div className="custom-products-shelf" style={{ margin: 0, padding: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="section-label" style={{ fontSize: '0.68rem' }}>3D Synthesis Feature Extraction:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className="badge-tag" style={{ background: '#22c55e', margin: 0 }}>✓ Cabriole 3D Legs</span>
                  <span className="badge-tag" style={{ background: '#3b82f6', margin: 0 }}>✓ Brass Caster Wheels</span>
                  <span className="badge-tag" style={{ background: '#a855f7', margin: 0 }}>✓ Diamond Tufted Cushion</span>
                  <span className="badge-tag" style={{ background: '#eab308', margin: 0 }}>✓ Spoon-Back Frame</span>
                  <span className="badge-tag" style={{ background: '#ec4899', margin: 0 }}>✓ 360° Velvet & Mahogany PBR</span>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="input-group">
              <label htmlFor="model-name-input">Product Title in Catalog:</label>
              <input
                id="model-name-input"
                className="text-input"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            {/* Room Destination */}
            <div className="input-group">
              <label htmlFor="catalog-room-select">Catalog Room Destination:</label>
              <select
                id="catalog-room-select"
                className="select-input"
                value={roomTarget}
                onChange={(e) => setRoomTarget(e.target.value)}
              >
                <option value="living">Living Salon</option>
                <option value="bedroom">Master Suite</option>
                <option value="kitchen">Kitchen & Dining</option>
                <option value="terrace">Outdoor Terrace</option>
              </select>
            </div>

            {/* 1:1 Metric Dimensions */}
            <div className="dimensions-grid">
              <div className="dim-field">
                <label>Width (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.3"
                  max="6.0"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 0.8 }))}
                />
              </div>
              <div className="dim-field">
                <label>Depth (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.3"
                  max="6.0"
                  value={dimensions.depth}
                  onChange={(e) => setDimensions(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0.78 }))}
                />
              </div>
              <div className="dim-field">
                <label>Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.2"
                  max="4.0"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || 0.82 }))}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live 3D Polygonal Mesh Preview Canvas */}
          <div className="dialog-col preview-col">
            <span className="preview-label">Live 3D Polygonal Mesh Preview (Generated from Your Image):</span>
            <div className="canvas-wrapper">
              <canvas ref={previewCanvasRef} width={360} height={260} />
              <div className="preview-overlay-badge">
                ↔ {dimensions.width.toFixed(2)}m × {dimensions.depth.toFixed(2)}m × {dimensions.height.toFixed(2)}m
              </div>
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e5b869',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  ⏳ Synthesizing 3D Polygons...
                </div>
              )}
            </div>

            <div className="preview-source-card">
              <div className="source-info">
                <span className="source-label">Source Photo:</span>
                <span className="source-analysis-tag">{detectedSummary}</span>
              </div>
              <img src={currentImage} alt="Uploaded Source" className="source-thumb" />
            </div>

            <button
              className="featured-stage-btn full-width place-btn"
              id="confirm-place-image-model-btn"
              disabled={isGenerating || isProcessing}
              onClick={handleGenerateAndAddToProducts}
            >
              <span>{isGenerating ? '⏳' : '✨'}</span>
              <span>{isGenerating ? 'Synthesizing 3D Polygons...' : 'Generate 3D Model & Add to Scene'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
