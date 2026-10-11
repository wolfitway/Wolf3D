# 🐺 Wolf3D — Spatial 3D Architectural Sandbox

> **Fork-Only / As-Is Release**: This project is open-sourced under the MIT License as an open architectural 3D sandbox. It is released as **fork-only** — you are encouraged to fork, explore, adapt, and build upon the code for your own commercial or personal projects!

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-r186-black?logo=threedotjs)
![Rapier3D](https://img.shields.io/badge/Physics-Rapier3D-red)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?logo=vite&logoColor=white)
![Self-Contained](https://img.shields.io/badge/Backend-100%25%20Client--Side-brightgreen)

---

## 📌 Fork-Only Notice

This repository is **unmaintained by the original authors and provided strictly as-is**. 

- 🍴 **Feel free to fork:** You are welcome to fork this repository and extend it, rebrand it, or integrate it into your own tools.
- 🚫 **No upstream PRs / Issue triage:** Upstream pull requests and issues are not monitored. All future development happens in your own forks!

---

## 🌟 What is Wolf3D?

Wolf3D is a self-contained, interactive 3D spatial architectural experience built with **React 19**, **Three.js**, and **Rapier3D physics**. It allows users to design, manipulate, measure, and tour architectural interiors directly in the browser with **zero backend dependencies or cloud services required**.

### Key Highlights:
1. **100% Client-Side Photo-to-3D Synthesis:** Upload any 2D photo of furniture, and an in-browser algorithm extracts colors, detects archetypes (armchair, sofa, coffee table), and dynamically synthesizes a genuine 3D mesh with PBR materials and physics collision bounds.
2. **True Physics Simulation (Rapier3D):** Furniture isn't just floating geometry — pieces have weight, collision hulls, and settle naturally onto floors and surfaces with gravity.
3. **Parametric Architectural Layouts:** Toggle seamlessly between multiple floorplans (*Villa Lumina*, *Micro Studio*, *Open Loft*).
4. **Circadian Lighting & Atmosphere:** Realistic lighting progression across dawn, noon, sunset, and midnight with physical tone mapping.
5. **Architectural & CAD Tooling:** 1:1 metric laser tape measure, BIM wall dimensions, and floor plan views.
6. **VIP Showcase & Walkthrough:** Distraction-free presentation mode with cinematic letterboxing, audio ambience, and automated camera routes.

---

## 🕹️ How to Use the App

### 1. Studio Editor Mode
The primary design workspace for spatial arrangement and customization:
* **Browse Furniture:** Click **Furniture** in the right toolbar to open the catalog drawer and spawn artisan furniture pieces into the room.
* **Select & Transform:** Click any furniture piece to open the **Item Transform HUD**.
  * **Grab & Move `[G]`:** Slide the piece along the floor plane.
  * **Axis Locks `[X]` / `[Z]`:** Constrain movement strictly to the X or Z axis while moving.
  * **Rotate `[R]`:** Rotate the piece 45° around the vertical axis.
  * **Settle `[S]` or `[Space]`:** Run physics settling so the item rests flush against the floor or supporting surface.
  * **Lock `[L]`:** Freeze pieces in place so they cannot be accidentally moved.
* **Metric Laser Measure `[M]`:** Click the measure tool, click any two points in 3D space, and view exact real-world distances in meters.
* **Circadian Lighting:** Use the bottom timeline tabs to cycle between *Dawn*, *Noon*, *Golden Dusk*, and *Midnight*.

### 2. Client Presentation / VIP Showcase
Click the mode switcher pill at the top of the screen to switch to **VIP Showcase**:
* Distraction-free, full-screen architectural showcase designed for walkthroughs.
* **Camera Bookmarks:** Jump instantly between preset viewpoints (*Grand Entrance*, *Living Room*, *Master Suite*, *Kitchen*).
* **Cinematic Letterbox `[C]`:** Toggle anamorphic 2.39:1 widescreen framing.
* **High-Res Snapshot:** Click the camera icon in presentation mode to download an instant capture of the current scene.

### 3. Client-Side Photo to 3D (`[U]`)
* Click the **Photo to 3D `[U]`** button on the toolbar.
* Upload any furniture photo (or select a preset sample).
* The in-browser canvas pipeline extracts foreground materials, detects the furniture style, and creates a 3D model with realistic PBR textures right in your browser.
* Click **Place in Room** to drop your new custom piece directly into the 3D scene with Rapier3D physics.

---

## ⌨️ Keyboard Shortcuts Reference

| Key | Action | Mode |
| :---: | :--- | :--- |
| **`[G]`** | Grab & Move selected piece across floor | Studio |
| **`[X]`** | Lock movement to X axis (while moving) | Studio |
| **`[Z]`** | Lock movement to Z axis (while moving) | Studio |
| **`[R]`** | Rotate selected piece 45° | Studio |
| **`[S]`** / **`[Space]`** | Settle piece to floor / surface | Studio |
| **`[L]`** | Lock / Unlock structural shell & furniture | Studio |
| **`[M]`** | Toggle 1:1 Metric Laser Tape Measure | Studio |
| **`[U]`** | Open Photo-to-3D Generator Modal | Studio |
| **`[C]`** | Toggle 2.39:1 Cinematic Letterbox | Global |
| **`[F]`** | Toggle Fullscreen | Global |
| **`[Esc]`** | Deselect active object / Reset view | Global |

---

## 💻 Developer Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (Node 20+ recommended)
- `npm` (or `pnpm` / `yarn`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/wolf3d.git
cd wolf3d
npm install
```

### 2. Run the Local Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```
The output will be bundled to `dist/` ready for zero-config hosting on GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

---

## 📁 Repository Structure

```text
Wolf3D/
├── public/
│   ├── models/           # Pre-built GLB 3D furniture & decor models
│   └── images/           # Sample room photos and texture maps
├── src/
│   ├── App.jsx           # Main React root & global keybindings
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── HouseScene.jsx          # Three.js scene, camera, lighting, & loops
│   │   │   ├── ImageTo3DGenerator.js   # 100% in-browser procedural 3D synthesis
│   │   │   ├── furnitureModels.js     # Procedural model constructors
│   │   │   └── glbFurnitureLoader.js   # GLB asset loader with caching
│   │   └── ui/                         # React UI overlays, HUDs, and drawers
│   ├── data/
│   │   └── constants.js  # Style palettes, camera views, & specs
│   ├── physics/
│   │   └── physicsEngine.js  # Rapier3D physics manager
│   ├── store/
│   │   └── atoms.js      # Jotai state management
│   ├── textures/
│   │   └── proceduralTextures.js # Procedural canvas textures
│   └── utils/
│       └── imageFeatureExtractor.js # In-browser canvas pixel analyzer
├── scripts/
│   ├── blender_models/   # Offline Blender script for procedural GLB assets
│   └── hunyuan3d/        # Headless Blender mesh optimization utility
├── index.html            # Main HTML entrypoint
├── package.json          # Dependencies & npm scripts
├── style.css             # Unified modern dark-mode design system
└── vite.config.js        # Vite bundler configuration
```

---

## 🛠️ Tech Stack

* **UI & State:** [React 19](https://react.dev/), [Jotai](https://jotai.org/), [Lucide React](https://lucide.dev/), Vanilla CSS
* **3D & Graphics:** [Three.js](https://threejs.org/) (r186), [GSAP](https://gsap.com/)
* **Physics:** [@dimforge/rapier3d-compat](https://rapier.rs/)
* **Tooling:** [Vite 8](https://vitejs.dev/)

---

## 📄 License

This software is released under the [MIT License](LICENSE). You are free to fork, modify, commercialize, or redistribute it as you see fit.
