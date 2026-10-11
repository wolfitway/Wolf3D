import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/03f2fb3f-2bdf-4e19-b395-3971814b1085';

async function run() {
  console.log('1. Launching headless Google Chrome (100% background, zero mouse disruption)...');
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
  console.log('2. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for 3D canvas and three.js scene to render
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('3. Waiting for Three.js scene & textures to stabilize...');
  await new Promise(r => setTimeout(r, 4500));

  // 1. Overview view
  const shot1 = path.join(ARTIFACT_DIR, 'headless_1_overview.png');
  await page.screenshot({ path: shot1 });
  console.log('Captured 1: Studio Overview ->', shot1);

  // 2. Open Walkthrough mode
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const walkBtn = btns.find(b => b.textContent && b.textContent.includes('Walkthrough'));
    if (walkBtn) walkBtn.click();
  });
  console.log('4. Opened Unified Walkthrough HUD...');
  await new Promise(r => setTimeout(r, 2500));

  const shot2 = path.join(ARTIFACT_DIR, 'headless_2_walk_hud.png');
  await page.screenshot({ path: shot2 });
  console.log('Captured 2: Unified Walk HUD ->', shot2);

  // 3. Jump to Master Suite
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('suite');
    }
  });
  console.log('5. Gliding camera to Master Suite...');
  await new Promise(r => setTimeout(r, 3500));

  const shot3 = path.join(ARTIFACT_DIR, 'headless_3_master_suite.png');
  await page.screenshot({ path: shot3 });
  console.log('Captured 3: Master Suite Bed & Walls ->', shot3);

  // 4. Jump to Living Salon to see curtains & walls
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('salon');
    }
  });
  console.log('6. Gliding camera to Living Salon...');
  await new Promise(r => setTimeout(r, 3500));

  const shot4 = path.join(ARTIFACT_DIR, 'headless_4_living_salon.png');
  await page.screenshot({ path: shot4 });
  console.log('Captured 4: Living Salon & Drapery ->', shot4);

  // 5. Exit Walk mode and open Catalog drawer
  await page.evaluate(() => {
    const exitBtn = document.querySelector('#walk-exit-btn');
    if (exitBtn) exitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const catBtn = document.querySelector('#catalog-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Catalog') || b.textContent.includes('Furniture'));
    if (catBtn) catBtn.click();
  });
  console.log('7. Opening Catalog Drawer...');
  await new Promise(r => setTimeout(r, 2000));

  const shot5 = path.join(ARTIFACT_DIR, 'headless_5_catalog_drawer.png');
  await page.screenshot({ path: shot5 });
  console.log('Captured 5: Catalog Drawer ->', shot5);

  await browser.close();
  console.log('Headless testing pipeline finished with 5 pictures captured!');
}

run().catch(err => {
  console.error('Headless test script error:', err);
  process.exit(1);
});
