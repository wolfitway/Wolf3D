# 🏛️ Wolf3D In-House Neural Image-to-3D Engine: Architecture & Execution Plan

## 1. Executive Summary & Vision
Wolf3D is transitioning from rudimentary procedural geometry generation (stitching boxes/cylinders together) to an **in-house, self-hosted Neural Image-to-3D Reconstruction Engine**. 

Instead of relying on third-party paid cloud APIs (Tripo, Meshy, etc.), we leverage the local workstation's hardware:
- **GPU:** NVIDIA GeForce RTX 3060 (12 GB VRAM, CUDA 13.2)
- **Blender:** System installation at `/usr/local/bin/blender`
- **Python:** 3.12.3 with PyTorch CUDA acceleration

This system takes **any user photo** (furniture, antiques, decor, electronics, sculptures) and automatically produces a watertight, textured **glTF/GLB** model ready for real-time placement and physics simulation in Wolf3D.

---

## 2. Neural Pipeline Architecture

```
┌──────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  User Photo  │ ──> │ Stage 1: Segmentation │ ──> │ Stage 2: 3D Generator  │
│ (PNG / JPEG) │     │ (RMBG / BiRefNet)     │     │ (TripoSR / TRELLIS)    │
└──────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                │
                                                                ▼
┌──────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Three.js Scene│ <── │ Stage 4: WebGL Normal │ <── │ Stage 3: Post-Process  │
│  & Rapier3D  │     │ (Pivot, Scale, Physic)│     │ (Blender UV & GLB Bake)│
└──────────────┘     └───────────────────────┘     └────────────────────────┘
```

### Stage 1: Foreground Extraction & Alpha Matting
- **Component:** `rembg` / BiRefNet / RMBG-1.4.
- **Process:** Strips messy backgrounds, isolates the object of interest, and generates a clean RGBA PNG with alpha channel.

### Stage 2: Single-Image to 3D Neural Backbone
- **Engine Backbone:** **TripoSR** (MIT Open Source by Stability AI + Tripo) as the high-speed primary engine (~0.5–1.5s on RTX 3060), with **TRELLIS** (Microsoft Research) as the high-fidelity PBR secondary option.
- **Process:** The transformer-based Large Reconstruction Model (LRM) predicts 3D neural representations (NeRF/triplane/tetrahedra grid) from a single view, predicting unseen rear, side, and bottom facets.

### Stage 3: Surface Extraction, UV Unwrapping & GLB Baking
- **Component:** Headless Blender (`/usr/local/bin/blender -b -P postprocess.py`) and `trimesh`.
- **Process:**
  1. Iso-surface mesh extraction (Marching Tetrahedra / Cubes).
  2. Mesh decimation to optimal real-time polycount (~15k–40k faces).
  3. Non-manifold edge repair and normal smoothing.
  4. Automatic UV unwrap and diffuse/PBR texture projection.
  5. Export to binary glTF 2.0 (`.glb`) saved to `public/models/generated/{id}.glb`.

### Stage 4: Three.js Ingestion & Rapier3D Physics
- **Component:** Three.js `GLTFLoader`, Jotai store atoms, and Rapier3D physics.
- **Process:**
  1. Center bounding box on $(X, Z)$ and ground base pivot at $Y = 0$.
  2. Rescale uniformly to real-world target metric dimensions (e.g., $0.85\text{m}$ chair).
  3. Generate Rapier3D convex hull / box collider for gravity and collision.
  4. Spawn into scene with live transform gizmo.

---

## 3. Directory & File Structure

```
Wolf3D/
├── scripts/
│   ├── ai_engine/
│   │   ├── server.py              # FastAPI microservice on http://localhost:8000
│   │   ├── segmenter.py           # Background matting (RMBG / BiRefNet)
│   │   ├── reconstructor.py       # TripoSR / local neural 3D inference
│   │   ├── postprocessor.py       # Headless Blender UV unwrapping & GLB export
│   │   ├── requirements.txt       # Dependencies (torch, trimesh, rembg, einops)
│   │   └── start_ai_engine.sh     # One-click startup script with venv
│   └── test_image_to_3d_flow.mjs  # Headless test runner
├── public/
│   └── models/
│       └── generated/             # Storage for generated GLB assets
└── src/
    ├── components/
    │   └── ui/
    │       └── ImageTo3dModal.jsx # React UI with upload, live progress & 3D preview
    └── utils/
        └── ai3dClient.js          # Client-side API connector with SSE progress
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Python Environment & TripoSR Inference Setup
- [ ] Initialize Python virtual environment in `scripts/ai_engine/venv/`.
- [ ] Install PyTorch with CUDA 12.x/13.x acceleration, `trimesh`, `rembg`, `einops`, `omegaconf`.
- [ ] Clone and integrate the open-source TripoSR model weights.
- [ ] Build standalone CLI runner `python3 test_infer.py --image input.png --output output.glb` and benchmark on RTX 3060.

### Phase 2: Headless Blender Post-Processing Pipeline
- [ ] Implement `scripts/ai_engine/postprocessor.py` for headless Blender execution.
- [ ] Automated mesh decimation (preserve visual silhouette while reducing polycount).
- [ ] Normal calculation and UV unwrapping.
- [ ] Export standard PBR glTF (`.glb`) to `public/models/generated/`.

### Phase 3: FastAPI Microservice with Real-Time Progress Streaming
- [ ] Create `server.py` with endpoints:
  - `POST /api/generate-3d`: accepts image upload and target dimensions.
  - `GET /api/progress/{task_id}`: Server-Sent Events (SSE) streaming progress (0%..100%).
  - `GET /api/health`: GPU VRAM check and status.
- [ ] Create `start_ai_engine.sh` for easy launch alongside the Vite dev server.

### Phase 4: Frontend UI & Three.js Scene Integration
- [ ] Build `src/utils/ai3dClient.js` to dispatch upload and subscribe to SSE progress.
- [ ] Update `ImageTo3dModal.jsx`:
  - Show real-time progress steps: *Removing background $\to$ Neural 3D synthesis $\to$ Baking UV textures $\to$ Ready*.
  - Render live 3D turntable preview in the modal canvas once generated.
  - One-click "Place in Room" button spawns the model with Rapier3D physics and bounds normalization.
- [ ] Save generated models to local catalog store (Jotai atoms + IndexedDB) for persistence across sessions.

---

## 5. Hardware Specifications & Performance Targets
- **Inference Time:** $< 2.0$ seconds for 3D geometry generation.
- **Blender Post-Processing:** $< 3.0$ seconds for UV unwrap & GLB export.
- **Total Pipeline Latency:** $< 5.0$ seconds from photo drop to 3D scene placement.
- **Peak VRAM Target:** $\le 6.5$ GB (leaving ~5.5 GB headroom on the RTX 3060).
