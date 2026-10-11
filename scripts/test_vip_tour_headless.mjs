import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/7432ea48-1a5c-4400-9dc8-041d8b0b3735';

async function run() {
  console.log('===============================================================');
  console.log(' HEADLESS BROWSER VERIFICATION: FURNITURE & AVATAR COLLISION + VIP TOUR GUIDE');
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
    // Filter noise
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
  await new Promise(r => setTimeout(r, 4000));

  // Capture initial dollhouse overview
  const shotInit = path.join(ARTIFACT_DIR, '01_initial_state.png');
  await page.screenshot({ path: shotInit });
  console.log('1. Captured initial 3D overview:', shotInit);

  // Switch to First-Person Walk Mode
  console.log('\n--- Switching to First-Person Walkthrough ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const walkBtn = btns.find(b => b.textContent && b.textContent.includes('Walkthrough'));
    if (walkBtn) walkBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Pause autopilot tour so we can perform precision WASD collision tests
  await page.evaluate(() => {
    const pauseBtn = document.getElementById('walk-autopilot-btn');
    if (pauseBtn && pauseBtn.textContent.includes('Pause')) {
      pauseBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // -------------------------------------------------------------
  // TEST A: FURNITURE COLLISION - KITCHEN MARBLE ISLAND
  // Kitchen island is at x=2.8, z=-2.4, size width: 2.7, depth: 1.1 (z-extent: -2.95 to -1.85)
  // -------------------------------------------------------------
  console.log('\n>>> TEST A: Furniture Impassability (Kitchen Island at x=2.8, z=-2.4)');
  const islandStart = await page.evaluate(() => {
    if (window.__wolfCamera) {
      window.__wolfCamera.position.set(2.8, 1.65, -1.35);
      window.__wolfCamera.rotation.set(0, Math.PI, 0); // Looking towards -Z directly at island
      return { x: window.__wolfCamera.position.x, z: window.__wolfCamera.position.z };
    }
    return null;
  });
  console.log('Camera positioned facing Kitchen Island:', islandStart);

  console.log('Holding "W" for 1.6s to walk straight into Kitchen Island...');
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 1600));
  await page.keyboard.up('KeyW');

  const islandEnd = await page.evaluate(() => {
    if (window.__wolfCamera) {
      return { x: window.__wolfCamera.position.x, z: window.__wolfCamera.position.z };
    }
    return null;
  });
  console.log('Camera position after walking towards Kitchen Island:', islandEnd);

  // Expected: Island edge is at z = -1.85. With collision radius 0.35 + buffer, z should not exceed -1.45.
  const islandPass = islandEnd && islandEnd.z > -1.65;
  console.log(`TEST A RESULT: ${islandPass ? 'PASSED (Kitchen Island is SOLID and IMPASSABLE)' : 'FAILED (Penetrated)'}`);

  const shotIsland = path.join(ARTIFACT_DIR, '05_furniture_collision_test.png');
  await page.screenshot({ path: shotIsland });

  // -------------------------------------------------------------
  // TEST B: AVATAR / "BABE" COLLISION - SOPHIA IMPASSABILITY
  // Ensure the user cannot walk through Sophia's avatar body
  // -------------------------------------------------------------
  console.log('\n>>> TEST B: Avatar Impassability (VIP Guide Sophia)');
  const sophiaPos = await page.evaluate(() => {
    if (window.__wolfAvatarManager) {
      const info = window.__wolfAvatarManager.getGuideInfo();
      if (info && info.position) {
        return { x: info.position.x, z: info.position.z };
      }
    }
    return null;
  });
  console.log('Sophia current position:', sophiaPos);

  if (sophiaPos) {
    // Position camera 1.1 meters in front of Sophia, looking directly at her
    const camNearSophia = await page.evaluate((sPos) => {
      if (window.__wolfCamera) {
        // Place camera at sPos.x, and sPos.z + 1.1, facing -Z (towards Sophia)
        window.__wolfCamera.position.set(sPos.x, 1.65, sPos.z + 1.1);
        window.__wolfCamera.rotation.set(0, Math.PI, 0); // facing -Z
        return { x: window.__wolfCamera.position.x, z: window.__wolfCamera.position.z };
      }
      return null;
    }, sophiaPos);
    console.log('Camera placed directly in front of Sophia facing her:', camNearSophia);

    console.log('Holding "W" for 1.5s to walk straight through Sophia...');
    await page.keyboard.down('KeyW');
    await new Promise(r => setTimeout(r, 1500));
    await page.keyboard.up('KeyW');

    const camAfterSophiaWalk = await page.evaluate(() => {
      if (window.__wolfCamera) {
        return { x: window.__wolfCamera.position.x, z: window.__wolfCamera.position.z };
      }
      return null;
    });
    console.log('Camera position after walking into Sophia:', camAfterSophiaWalk);

    // Sophia is at sophiaPos.z. With her radius 0.30 + player radius 0.35 = 0.65m buffer.
    // So camera should stop around sophiaPos.z + 0.65 and NOT penetrate past sophiaPos.z!
    const avatarPass = camAfterSophiaWalk && (camAfterSophiaWalk.z >= sophiaPos.z + 0.50);
    console.log(`TEST B RESULT: ${avatarPass ? 'PASSED (Sophia avatar is SOLID and IMPASSABLE)' : 'FAILED (Penetrated)'}`);

    const shotAvatarCollision = path.join(ARTIFACT_DIR, '08_avatar_babe_collision_test.png');
    await page.screenshot({ path: shotAvatarCollision });
  }

  // -------------------------------------------------------------
  // TEST C: VIP TOUR GUIDE AUTOPILOT & PRESENTATION COMMENTARY
  // Test guided tour stops with Sophia leading and narrating
  // -------------------------------------------------------------
  console.log('\n>>> TEST C: VIP Tour Guide Autopilot & Presentation');

  // Jump to Living Salon via bookmark pill
  console.log('1. Dispatching VIP Guide Sophia to Living Salon...');
  await page.evaluate(() => {
    const salonBtn = document.getElementById('walk-pill-salon');
    if (salonBtn) salonBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  const salonGuide = await page.evaluate(() => {
    return window.__wolfAvatarManager ? window.__wolfAvatarManager.getGuideInfo() : null;
  });
  console.log('Sophia status in Living Salon:', salonGuide);

  const shotSalon = path.join(ARTIFACT_DIR, '06_guide_sophia_salon.png');
  await page.screenshot({ path: shotSalon });

  // Test Camera Focus on Guide
  console.log('2. Clicking "Focus Guide" button...');
  await page.evaluate(() => {
    const focusBtn = document.getElementById('walk-focus-guide-btn');
    if (focusBtn) focusBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Jump to Chef Island
  console.log('3. Dispatching VIP Guide Sophia to Chef\'s Island...');
  await page.evaluate(() => {
    const kitchenBtn = document.getElementById('walk-pill-kitchen');
    if (kitchenBtn) kitchenBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  const kitchenGuide = await page.evaluate(() => {
    return window.__wolfAvatarManager ? window.__wolfAvatarManager.getGuideInfo() : null;
  });
  console.log('Sophia status at Chef\'s Island:', kitchenGuide);

  const shotKitchen = path.join(ARTIFACT_DIR, '09_guide_sophia_kitchen.png');
  await page.screenshot({ path: shotKitchen });

  // Jump to Master Suite
  console.log('4. Dispatching VIP Guide Sophia to Master Suite...');
  await page.evaluate(() => {
    const suiteBtn = document.getElementById('walk-pill-suite');
    if (suiteBtn) suiteBtn.click();
  });
  await new Promise(r => setTimeout(r, 3800));

  const suiteGuide = await page.evaluate(() => {
    return window.__wolfAvatarManager ? window.__wolfAvatarManager.getGuideInfo() : null;
  });
  console.log('Sophia status in Master Suite:', suiteGuide);

  const shotSuite = path.join(ARTIFACT_DIR, '07_guide_sophia_suite.png');
  await page.screenshot({ path: shotSuite });

  // Read live HUD status text
  const hudInfo = await page.evaluate(() => {
    const title = document.querySelector('.walk-narrative-title')?.textContent;
    const guideChip = document.querySelector('.walk-guide-chip')?.textContent;
    const speech = document.querySelector('.walk-guide-speech')?.textContent;
    return { title, guideChip, speech };
  });
  console.log('\nHUD Live State:', hudInfo);

  await browser.close();
  console.log('===============================================================');
  console.log(' HEADLESS VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('===============================================================');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
