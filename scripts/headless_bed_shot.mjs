import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/03f2fb3f-2bdf-4e19-b395-3971814b1085';

async function run() {
  console.log('Running 100% headless Chrome test...');
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
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4500));

  // 1. Perspective View of Master Suite Bed, Curtains & Slat Wall
  await page.evaluate(() => {
    if (window.__wolfGlideToCoord) {
      // Position camera inside bedroom looking at the bed & curtains
      window.__wolfGlideToCoord({ x: 3.8, y: 1.45, z: 0.7 }, { x: 2.5, y: 0.75, z: 2.2 });
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const shotBed = path.join(ARTIFACT_DIR, 'headless_bed_and_curtains_closeup.png');
  await page.screenshot({ path: shotBed });
  console.log('Captured real bed and curtains close-up:', shotBed);

  // 2. Open Walkthrough mode and glide along the unified route
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const walkBtn = btns.find(b => b.textContent && b.textContent.includes('Walkthrough'));
    if (walkBtn) walkBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Jump to Living Salon in Walk mode
  await page.evaluate(() => {
    if (window.__wolfGlideToBookmark) {
      window.__wolfGlideToBookmark('salon');
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const shotSalon = path.join(ARTIFACT_DIR, 'headless_living_salon_walk.png');
  await page.screenshot({ path: shotSalon });
  console.log('Captured living salon walk view:', shotSalon);

  await browser.close();
  console.log('Completed test.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
