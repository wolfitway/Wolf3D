import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/dan/.gemini/antigravity-ide/brain/7432ea48-1a5c-4400-9dc8-041d8b0b3735';

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
  await new Promise(r => setTimeout(r, 3500));

  // Enter First-Person Walk
  console.log('Entering First-Person Walk...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Walkthrough'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Pause autopilot if on so user has manual WASD control
  await page.evaluate(() => {
    const pauseBtn = document.getElementById('walk-autopilot-btn');
    if (pauseBtn && pauseBtn.textContent.includes('Pause')) {
      pauseBtn.click();
    }
  });

  // Check initial camera position
  const camStart = await page.evaluate(() => {
    // expose camera pos
    return {
      camPos: window.__wolfCamera ? { x: window.__wolfCamera.position.x, y: window.__wolfCamera.position.y, z: window.__wolfCamera.position.z } : null
    };
  });
  console.log('Camera start:', camStart);

  // Position camera at x=2.8, z=-1.0 (facing towards island at z=-2.4, so forward is -Z)
  console.log('Positioning camera facing island...');
  const placed = await page.evaluate(() => {
    if (window.__wolfGlideToCoord) {
      window.__wolfGlideToCoord(2.8, -1.2);
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now press 'W' key down for 2 seconds to walk directly into the island
  console.log('Holding W to walk into island...');
  await page.keyboard.down('KeyW');
  const positionsDuringWalk = [];
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 100));
    const pos = await page.evaluate(() => {
      // Look at camera in scene
      return {
        // Find camera
        hudText: document.querySelector('.walk-status-pill')?.textContent
      };
    });
  }
  await page.keyboard.up('KeyW');

  // Let's inspect the actual HouseScene camera position from inside page.evaluate
  const camEnd = await page.evaluate(() => {
    // Let's get window variables or query THREE objects
    return window.__wolfDebugCollision ? window.__wolfDebugCollision() : null;
  });
  console.log('Cam end / debug collision:', camEnd);

  const shotCollision = path.join(ARTIFACT_DIR, '04_walk_into_furniture.png');
  await page.screenshot({ path: shotCollision });

  await browser.close();
}

run().catch(console.error);
