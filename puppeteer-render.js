const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/home/appuser/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome';

async function renderRoom() {
  console.log('Launching Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  try {
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    const htmlPath = path.join(__dirname, 'render-room.html');
    console.log(`Loading HTML from: ${htmlPath}`);
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });

    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    console.log('Waiting for three.js to render...');
    
    await page.waitForFunction(() => {
      return window.renderComplete === true;
    }, { timeout: 10000 });

    console.log('Waiting for animation frames to complete...');
    await page.waitForTimeout(1000);

    console.log('Capturing screenshot...');
    const screenshotPath = path.join(__dirname, 'screenshots', 'room-render.png');
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
      quality: 100,
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    const fileSize = fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath).size : 0;
    console.log(`Screenshot size: ${(fileSize / 1024).toFixed(2)} KB`);

    return screenshotPath;
    
  } catch (error) {
    console.error('Error during rendering:', error);
    throw error;
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

async function renderWithItems(items = []) {
  console.log('Rendering room with items:', items);
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    
    const htmlPath = path.join(__dirname, 'render-room.html');
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });

    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForFunction(() => {
      return window.renderComplete === true;
    }, { timeout: 10000 });

    await page.waitForTimeout(1000);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotDir, `room-items-${items.join('-')}-${timestamp}.png`);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
      quality: 100,
    });

    console.log(`Screenshot with items saved to: ${screenshotPath}`);
    
    return screenshotPath;
    
  } catch (error) {
    console.error('Error during rendering with items:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  renderRoom,
  renderWithItems,
};

if (require.main === module) {
  renderRoom()
    .then(() => console.log('Rendering complete!'))
    .catch((err) => {
      console.error('Rendering failed:', err);
      process.exit(1);
    });
}
