

import puppeteer from 'puppeteer';
import logger from './appLogger.js';

/**
 * Approach:
 * - Products and pincodes are provided via environment variables for Docker/config-driven operation.
 * - Navigates to the Amul protein product page and enters the provided pincode.
 * - Waits for product grid items to load and iterates through each configured product.
 * - For each product, checks if its name appears in the text content of each '.product-grid-item'.
 * - If the '.product-grid-item' has the 'outofstock' class, marks as unavailable; otherwise, marks as available.
 * - Extracts available item names from '.product-grid-name a' within each grid item.
 * - Returns a summary of available items per product.
 */



function logScraper(message, ...args) {
  logger.info(`[SCRAPER] ${message} ${args.length ? args.map(a => JSON.stringify(a)).join(' ') : ''}`);
}

async function enterPincode(page, pincode) {
  logScraper('Waiting for pincode input field (#search)...');
  await page.waitForSelector('#search', { timeout: 10000 });
  await page.evaluate(() => {
    const el = document.querySelector('#search');
    if (el) el.style.border = '2px solid red';
  });
  logScraper(`Entering pincode: ${pincode}`);
  await page.type('#search', pincode);
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.keyboard.press('Enter');
  logScraper('Submitted pincode, waiting for navigation...');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  logScraper(`Navigation complete. Current URL: ${page.url()}`);
}

async function getProductGridItems(page) {
  logScraper('Waiting for product grid items (.product-grid-item)...');
  await page.waitForSelector('.product-grid-item', { timeout: 20000 });
  const gridItems = await page.$$('.product-grid-item');
  logScraper(`Found ${gridItems.length} product-grid-item elements.`);
  return gridItems;
}

async function checkProductAvailability(gridItems, product) {
  let availableItems = [];
  logScraper(`Checking availability for product: '${product}'`);
  for (const [i, gridItem] of gridItems.entries()) {
    await gridItem.evaluate(el => { el.style.border = '2px solid red'; });
    const textContent = await gridItem.evaluate(el => el.textContent);
    if (textContent && textContent.includes(product)) {
      const hasOutOfStockClass = await gridItem.evaluate(el => el.classList.contains('outofstock'));
      if (!hasOutOfStockClass) {
        const nameHandle = await gridItem.$('.product-grid-name a');
        let itemName = '';
        if (nameHandle) {
          itemName = await nameHandle.evaluate(el => el.textContent.trim());
        }
        availableItems.push(itemName);
        logScraper(`Product '${product}' in grid item ${i}: AVAILABLE (Name: ${itemName})`);
        await gridItem.evaluate(el => { el.style.border = '2px solid orange'; });
      } else {
        logScraper(`Product '${product}' in grid item ${i}: OUT OF STOCK`);
      }
    }
  }
  logScraper(`Result for '${product}': Available=${availableItems.length}, Items: ${availableItems.join(', ')}`);
  return { product, availableCount: availableItems.length, availableItems };
}

export async function scrapeAvailabilities({ products, pincode }) {
  const url = 'https://shop.amul.com/en/browse/protein';
  const isLocal = process.env.APT_LOCAL === 'true';
  let browser;
  let page;
  let result = [];
  try {
    logScraper(`Launching browser. Headless: ${!isLocal}`);
    browser = await puppeteer.launch({
      headless: !isLocal,
      slowMo: isLocal ? 100 : 0
    });
    page = await browser.newPage();
    logScraper(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    await enterPincode(page, pincode);
    const gridItems = await getProductGridItems(page);

    for (const product of products) {
      const productResult = await checkProductAvailability(gridItems, product);
      result.push(productResult);
    }
  } catch (error) {
    console.error(`[SCRAPER] Error during scraping: ${error.message}`);
    result = products.map(product => ({ product, available: false, error: error.message }));
  } finally {
    if (browser) {
      await browser.close();
      logScraper('Browser closed.');
    }
  }
  return result;
}
