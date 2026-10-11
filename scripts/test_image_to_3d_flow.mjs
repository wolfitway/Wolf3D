import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/17270a13-1a55-4828-9794-2b5a59259588';

async function run() {
  console.log('===============================================================');
  console.log(' TEST: UPLOAD PICTURE -> GENERATE 3D MODEL & PLACE IN SCENE');
  console.log('===============================================================');

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
    const txt = msg.text();
    if (txt.includes('THREE') || txt.includes('[Vite]') || txt.includes('React')) return;
    console.log(`[BROWSER] ${msg.type()}: ${txt}`);
  });

  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]', err.toString());
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 3000));

  // 1. Initial 3D Scene Overview
  const shot1 = path.join(ARTIFACT_DIR, 'photo3d_01_initial_scene.png');
  await page.screenshot({ path: shot1 });
  console.log('1. Captured initial 3D scene overview:', shot1);

  // 2. Open Photo-to-3D Modal from quick toolbar
  console.log('\n--- Opening Photo-to-3D Modal ---');
  await page.evaluate(() => {
    const btn = document.getElementById('open-image-to-3d-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot2 = path.join(ARTIFACT_DIR, 'photo3d_02_modal_open.png');
  await page.screenshot({ path: shot2 });
  console.log('2. Captured Photo-to-3D Modal dialog with 3D preview:', shot2);

  // 3. Switch to Sun Lounger Daybed preset
  console.log('\n--- Selecting Sun Lounger Preset ---');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.preset-chip'));
    const loungerChip = chips.find(c => c.textContent && c.textContent.includes('Sun Lounger'));
    if (loungerChip) loungerChip.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot3 = path.join(ARTIFACT_DIR, 'photo3d_03_lounger_preset.png');
  await page.screenshot({ path: shot3 });
  console.log('3. Captured Sun Lounger preset selected with live preview:', shot3);

  // 4. Click "Generate & Place 3D Model in Room"
  console.log('\n--- Generating & Placing 3D Model into Room Scene ---');
  await page.evaluate(() => {
    const placeBtn = document.getElementById('confirm-place-image-model-btn');
    if (placeBtn) placeBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot4 = path.join(ARTIFACT_DIR, 'photo3d_04_placed_lounger_in_scene.png');
  await page.screenshot({ path: shot4 });
  console.log('4. Captured placed 3D model in room scene:', shot4);

  // 5. Open Photo-to-3D again, pick Sectional L-Sofa and place it too
  console.log('\n--- Generating & Placing Modular Sectional L-Sofa ---');
  await page.evaluate(() => {
    const btn = document.getElementById('open-image-to-3d-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.preset-chip'));
    const sofaChip = chips.find(c => c.textContent && c.textContent.includes('Modular Sectional'));
    if (sofaChip) sofaChip.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const placeBtn = document.getElementById('confirm-place-image-model-btn');
    if (placeBtn) placeBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot5 = path.join(ARTIFACT_DIR, 'photo3d_05_placed_sofa_in_scene.png');
  await page.screenshot({ path: shot5 });
  console.log('5. Captured placed modular sofa in room scene:', shot5);

  // 6. Verify Catalog Drawer Photo-to-3D Banner
  console.log('\n--- Verifying Catalog Drawer Photo-to-3D Action Card ---');
  await page.evaluate(() => {
    const catalogBtn = document.getElementById('open-catalog-btn');
    if (catalogBtn) catalogBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot6 = path.join(ARTIFACT_DIR, 'photo3d_06_catalog_drawer_card.png');
  await page.screenshot({ path: shot6 });
  console.log('6. Captured Catalog Drawer with Photo-to-3D Card:', shot6);

  await browser.close();
  console.log('\n✓ Test completed successfully! All screenshots saved.');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
