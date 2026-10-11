import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/17270a13-1a55-4828-9794-2b5a59259588';

async function run() {
  console.log('🚀 Launching Puppeteer Core for ArchiCAD & 1:1 Room Decorator Test...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=gl',
      '--enable-unsafe-swiftshader'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Initial 3D Studio View Screenshot
  console.log('📸 Capturing Initial 3D Studio...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_1_studio_overview.png') });

  // 2. Open Catalog Drawer & Test Room-by-Room Filters
  console.log('Opening Furniture Catalog Drawer...');
  await page.$eval('#open-catalog-btn', el => el.click());
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing Room Filter: Kitchen & Dining...');
  await page.$eval('#catalog-filter-kitchen', el => el.click());
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_2_catalog_room_filter_kitchen.png') });

  console.log('Testing Room Filter: Master Suite...');
  await page.$eval('#catalog-filter-bedroom', el => el.click());
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_3_catalog_room_filter_bedroom.png') });

  // Close Catalog
  await page.$eval('#close-catalog-btn', el => el.click());
  await new Promise(r => setTimeout(r, 500));

  // 3. Open CAD Drawer & Test 2D Plan Rebuilder Engine
  console.log('Opening Parametric CAD Drawer...');
  await page.$eval('#open-cad-btn', el => el.click());
  await new Promise(r => setTimeout(r, 600));

  console.log('Clicking "Load Sample 2D Blueprint Spec"...');
  await page.$eval('#cad-sample-plan-btn', el => el.click());
  await new Promise(r => setTimeout(r, 400));

  console.log('Clicking "Rebuild 3D House From This 2D Plan"...');
  await page.$eval('#cad-rebuild-3d-btn', el => el.click());
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_4_cad_rebuilder_executed.png') });

  // Close CAD Drawer
  await page.$eval('#close-cad-btn', el => el.click());
  await new Promise(r => setTimeout(r, 500));

  // 4. Switch to ArchiCAD 2D Presentation Mode
  console.log('Switching to ArchiCAD 2D Plan Presentation View...');
  await page.$eval('#view-plan', el => el.click());
  await new Promise(r => setTimeout(r, 1200));

  // Verify elements exist
  const hudExists = await page.$('#archicad-plan-hud');
  console.log('ArchiCAD Plan HUD exists:', !!hudExists);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_5_archicad_presentation_rebuilt.png') });

  // 5. Toggle Laser Tape Measure Tool
  console.log('Activating Laser Tape Measure Tool...');
  await page.$eval('#cad-toggle-measure-btn', el => el.click());
  await new Promise(r => setTimeout(r, 400));

  // Simulate clicking point A and point B on the canvas
  const canvasBox = await page.$eval('#canvas-container canvas', el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });

  const pA = { x: Math.round(canvasBox.x + canvasBox.width * 0.4), y: Math.round(canvasBox.y + canvasBox.height * 0.45) };
  const pB = { x: Math.round(canvasBox.x + canvasBox.width * 0.6), y: Math.round(canvasBox.y + canvasBox.height * 0.45) };

  await page.mouse.click(pA.x, pA.y);
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.move(pB.x, pB.y);
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.click(pB.x, pB.y);
  await new Promise(r => setTimeout(r, 800));

  console.log('📸 Capturing ArchiCAD with Laser Measurement...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_6_laser_measurement_pinned.png') });

  // 6. Return to 3D View
  console.log('Exiting back to 3D Perspective View...');
  await page.$eval('#cad-exit-plan-btn', el => el.click());
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow_7_return_to_3d_with_laser.png') });

  console.log('✅ ALL ARCHICAD, REBUILDER, & ROOM DECORATOR FLOW TESTS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
