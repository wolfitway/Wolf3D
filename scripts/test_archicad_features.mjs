import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/17270a13-1a55-4828-9794-2b5a59259588';

async function testArchicad() {
  console.log('1. Launching headless Chrome...');
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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('2. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for 3D canvas
  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 3500));

  // Take screenshot 1: Studio Overview with new Shell Lock toggle button
  const shot1 = path.join(ARTIFACT_DIR, 'archicad_1_studio_shell_lock.png');
  await page.screenshot({ path: shot1 });
  console.log('Screenshot 1 captured:', shot1);

  // Switch to Plan (CAD) view
  console.log('3. Switching to Plan (CAD) view...');
  await page.click('#view-plan');
  await new Promise(r => setTimeout(r, 2500));

  // Check if Archicad Plan HUD is present
  const planHud = await page.$('#archicad-plan-hud');
  console.log('Archicad Plan HUD element present:', !!planHud);

  // Take screenshot 2: Full ArchiCAD 2D CAD Presentation Mode
  const shot2 = path.join(ARTIFACT_DIR, 'archicad_2_plan_presentation_sheet.png');
  await page.screenshot({ path: shot2 });
  console.log('Screenshot 2 captured:', shot2);

  // Focus on Living Salon room
  console.log('4. Clicking Living Salon room chip...');
  await page.click('#cad-room-zone-living');
  await new Promise(r => setTimeout(r, 1800));

  const shot3 = path.join(ARTIFACT_DIR, 'archicad_3_living_salon_focus.png');
  await page.screenshot({ path: shot3 });
  console.log('Screenshot 3 captured:', shot3);

  // Focus on Master Suite room
  console.log('5. Clicking Master Suite room chip...');
  await page.click('#cad-room-zone-master');
  await new Promise(r => setTimeout(r, 1800));

  const shot4 = path.join(ARTIFACT_DIR, 'archicad_4_master_suite_focus.png');
  await page.screenshot({ path: shot4 });
  console.log('Screenshot 4 captured:', shot4);

  // Toggle Global Shell Lock in Plan HUD
  console.log('6. Toggling Global Shell Lock...');
  await page.click('#archicad-global-lock-btn');
  await new Promise(r => setTimeout(r, 800));

  const lockText = await page.$eval('#archicad-global-lock-btn', el => el.innerText);
  console.log('Global lock button text after click:', lockText.replace(/\n/g, ' '));

  const shot5 = path.join(ARTIFACT_DIR, 'archicad_5_shell_unlocked.png');
  await page.screenshot({ path: shot5 });
  console.log('Screenshot 5 captured:', shot5);

  // Return to 3D View
  console.log('7. Returning to 3D View...');
  await page.click('#cad-exit-plan-btn');
  await new Promise(r => setTimeout(r, 2000));

  const shot6 = path.join(ARTIFACT_DIR, 'archicad_6_back_to_3d.png');
  await page.screenshot({ path: shot6 });
  console.log('Screenshot 6 captured:', shot6);

  await browser.close();
  console.log('ALL ARCHICAD TESTS COMPLETED SUCCESSFULLY!');
}

testArchicad().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
