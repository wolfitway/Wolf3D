# Wolf3D Agent Memory & System Guidelines

## Core System Architecture
Wolf3D is an interactive 3D spatial architectural experience built with:
- **Frontend:** React 19, Three.js / React Three Fiber, Rapier3D physics (`@dimforge/rapier3d-compat`), Jotai state management, Vite.
- **Hardware Profile:** Linux workstation equipped with NVIDIA GeForce RTX 3060 (12 GB VRAM, CUDA 13.2), Python 3.12, Blender `/usr/local/bin/blender`.

## Strategic Directives: In-House Neural Image-to-3D Engine
1. **No External SaaS Dependencies:** The user explicitly requires building an **in-house, self-hosted Image-to-3D pipeline** running locally on their RTX 3060 rather than calling third-party paid cloud APIs like Tripo or Meshy.
2. **Deprecation of Procedural Primitive Mockups:** Do not attempt to synthesize organic 3D objects (chairs, sofas, decor) using primitive box/cylinder CSG script geometry. All image-to-3D conversions must use neural 3D reconstruction models.
3. **Core Pipeline Stack:**
   - **Foreground Extraction:** `rembg` / BiRefNet / RMBG-1.4.
   - **Neural 3D Backbone:** TripoSR (MIT open-source, < 2s inference on RTX 3060) + optional TRELLIS (Microsoft SOTA).
   - **Mesh Post-Processing:** Headless Blender (`/usr/local/bin/blender -b -P ...`) for UV unwrapping, decimation, and GLTF/GLB export to `public/models/generated/`.
   - **Local Microservice:** Python FastAPI (`scripts/ai_engine/server.py`) communicating with Wolf3D frontend via SSE and REST.
   - **Three.js & Rapier3D:** Automated bounding box normalization, bottom-center pivot grounding at $Y=0$, target metric scaling, and physics collision hull generation.

## Reference Documentation
- Master Execution Plan: [IMAGE_TO_3D_ENGINE_PLAN.md](file:///home/dan/projects/Wolf3D/IMAGE_TO_3D_ENGINE_PLAN.md)
