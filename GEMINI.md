# Wolf3D Agent Memory & System Guidelines

## Core System Architecture
Wolf3D is an interactive 3D spatial architectural experience built with:
- **Frontend:** React 19, Three.js / React Three Fiber, Rapier3D physics (`@dimforge/rapier3d-compat`), Jotai state management, Vite.
- **Hardware Profile:** Linux workstation equipped with NVIDIA GeForce RTX 3060 (12 GB VRAM, CUDA 13.2), Python 3.12, Blender `/usr/local/bin/blender`.

## Strategic Directives
1. **Self-Contained Architecture:** Wolf3D runs self-contained on Vite + Three.js + Rapier3D.
2. **Assets & Procedural Pipeline:** 3D furniture models are loaded from `public/models/*.glb` with parametric materials and dimensions, with support for offline Blender asset generation scripts in `scripts/blender_models/`.
3. **Three.js & Rapier3D:** Bounding box normalization, bottom-center pivot grounding at $Y=0$, target metric scaling, and physics collision hull generation.
