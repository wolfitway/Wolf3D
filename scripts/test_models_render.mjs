import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/ced8bfbe-0186-40e3-b3f5-b3959c699ebf';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('Launching headless Chrome to verify real Blender models in Three.js...');
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
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('warn')) {
      console.log(`[Browser ${msg.type()}]:`, text);
    }
  });

  page.on('pageerror', err => {
    console.error('[Browser PageError]:', err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('Waiting for Three.js & Blender GLBs to load and render...');
  await new Promise(r => setTimeout(r, 4000));

  // 1. Overall Architectural Diorama
  const shot1 = path.join(ARTIFACT_DIR, 'blender_models_1_overview.png');
  await page.screenshot({ path: shot1 });
  console.log('Captured 1: Overview Diorama ->', shot1);

  // 2. Bookmark: Living Salon (Designer Sectional Sofa, Fluted Travertine Coffee Table, Linen Armchair, Credenza)
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('salon');
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const shot2 = path.join(ARTIFACT_DIR, 'blender_models_2_salon.png');
  await page.screenshot({ path: shot2 });
  console.log('Captured 2: Living Salon ->', shot2);

  // 3. Bookmark: Gourmet Chef Kitchen & Dining Table
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('kitchen');
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const shot3 = path.join(ARTIFACT_DIR, 'blender_models_3_kitchen_dining.png');
  await page.screenshot({ path: shot3 });
  console.log('Captured 3: Kitchen & Dining ->', shot3);

  // 4. Bookmark: Master Suite (Platform King Bed with fluted headboard & duvet, Nightstand)
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('suite');
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const shot4 = path.join(ARTIFACT_DIR, 'blender_models_4_master_suite.png');
  await page.screenshot({ path: shot4 });
  console.log('Captured 4: Master Suite ->', shot4);

  await browser.close();
  console.log('Headless validation complete!');
}

run().catch(err => {
  console.error('Validation script error:', err);
  process.exit(1);
});
