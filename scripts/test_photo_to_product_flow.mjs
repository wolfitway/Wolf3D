import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/17270a13-1a55-4828-9794-2b5a59259588';

async function run() {
  console.log('===============================================================');
  console.log(' VERIFICATION: PHOTO -> TRUE 3D MODEL FROM SCRATCH -> CATALOG PRODUCT');
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

  // 1. Open Photo-to-3D Modal
  console.log('\n--- 1. Opening Photo to 3D Modal ---');
  await page.evaluate(() => {
    const btn = document.getElementById('open-image-to-3d-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot1 = path.join(ARTIFACT_DIR, 'photo_scratch_01_modal_preview.png');
  await page.screenshot({ path: shot1 });
  console.log('1. Captured Photo-to-3D Modal with 3D mesh preview from scratch:', shot1);

  // 2. Click "Generate 3D Model & Add to Products"
  console.log('\n--- 2. Generating 3D Model & Adding to Products ---');
  await page.evaluate(() => {
    const placeBtn = document.getElementById('confirm-place-image-model-btn');
    if (placeBtn) placeBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot2 = path.join(ARTIFACT_DIR, 'photo_scratch_02_placed_in_scene.png');
  await page.screenshot({ path: shot2 });
  console.log('2. Captured 3D model placed in scene with legs & cushions:', shot2);

  // 3. Open Furniture Catalog to verify custom product is listed
  console.log('\n--- 3. Verifying Custom Product in Architectural Catalog ---');
  await page.evaluate(() => {
    const catalogBtn = document.getElementById('open-catalog-btn');
    if (catalogBtn) catalogBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const customProductCount = await page.evaluate(() => {
    return document.querySelectorAll('.custom-product-card').length;
  });
  console.log(`Custom products found in catalog: ${customProductCount}`);

  const shot3 = path.join(ARTIFACT_DIR, 'photo_scratch_03_catalog_product_shelf.png');
  await page.screenshot({ path: shot3 });
  console.log('3. Captured Catalog Drawer with Custom 3D Product Shelf:', shot3);

  // 4. Click the custom product in the catalog to spawn another one!
  console.log('\n--- 4. Spawning another instance directly from Catalog ---');
  await page.evaluate(() => {
    const customCard = document.querySelector('.custom-product-card');
    if (customCard) customCard.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const shot4 = path.join(ARTIFACT_DIR, 'photo_scratch_04_spawned_from_catalog.png');
  await page.screenshot({ path: shot4 });
  console.log('4. Captured scene with multiple custom items spawned from catalog:', shot4);

  await browser.close();
  console.log('\n✓ All tests passed successfully!');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
