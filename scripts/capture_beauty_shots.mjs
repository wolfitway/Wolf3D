import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/ced8bfbe-0186-40e3-b3f5-b3959c699ebf';

async function run() {
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

  // Hide UI text badges/speech bubbles that might block the 3D views
  await page.addStyleTag({ content: '.speech-bubble, .avatar-tag, .occupant-badge, .hotspot-tag { display: none !important; }' });

  // 1. Living Salon View (Blender Sectional Sofa, Fluted Travertine Coffee Table, Armchair, Credenza)
  await page.evaluate(() => {
    window.__wolfGlideToBookmark('salon', 0.8);
  });
  await new Promise(r => setTimeout(r, 2000));
  const shot1 = path.join(ARTIFACT_DIR, 'beauty_shot_1_salon.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved:', shot1);

  // 2. Kitchen & Dining Island View (Blender Waterfall Marble Island, Brass Faucet, Dining Table & Wishbone Chairs)
  await page.evaluate(() => {
    window.__wolfGlideToBookmark('kitchen', 0.8);
  });
  await new Promise(r => setTimeout(r, 2000));
  const shot2 = path.join(ARTIFACT_DIR, 'beauty_shot_2_kitchen_dining.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved:', shot2);

  // 3. Master Suite View (Blender Floating Platform King Bed, Fluted Headboard, Folded Linen Duvet & Nightstand)
  await page.evaluate(() => {
    window.__wolfGlideToBookmark('suite', 0.8);
  });
  await new Promise(r => setTimeout(r, 2000));
  const shot3 = path.join(ARTIFACT_DIR, 'beauty_shot_3_master_bed.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved:', shot3);

  await browser.close();
  console.log('Finished capturing all beauty shots!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
