import puppeteer from 'puppeteer';

/**
 * Approach:
 * - Products and pincodes are provided via environment variables for Docker/config-driven operation.
 * - Navigate to the product listing page and enter the pincode.
 * - Wait for product grid items to load.
 * - For each configured product, check if its name appears in the text content of each '.product-grid-item'.
 * - If the '.product-grid-item' has the 'outofstock' class, mark as unavailable; otherwise, mark as available.
 * - Extract available item names from '.product-grid-name a' within each grid item.
 * - Return a summary of available items per product.
 */
export async function scrapeAvailability({ products, pincode }) {
  const url = 'https://shop.amul.com/en/browse/protein';
  const isLocal = process.env.APT_LOCAL === 'true';
  const browser = await puppeteer.launch({
    headless: !isLocal,
    slowMo: isLocal ? 100 : 0
  });
  const page = await browser.newPage();
  let result = [];
  try {
    console.log('Navigating to product page:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Waiting for pincode input field...');
    await page.waitForSelector('#search', { timeout: 10000 });
    console.log('Highlighting pincode input field.');
    await page.evaluate(() => {
      const el = document.querySelector('#search');
      if (el) el.style.border = '2px solid red';
    });
    console.log('Typing pincode:', pincode);
    await page.type('#search', pincode);
    console.log('Waiting 2 seconds for input to be visible.');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Pressing Enter to submit pincode.');
    await page.keyboard.press('Enter');
    console.log('Waiting for page navigation after pincode submit...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });
    console.log('Navigation complete. Adding delay to ensure page is stable...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Current URL after navigation:', page.url());
    console.log('Scraping product availability...');

    // Wait for any product-grid-item to appear
    await page.waitForSelector('.product-grid-item', { timeout: 20000 });
    const gridItems = await page.$$('.product-grid-item');
    console.log(`Found ${gridItems.length} product-grid-item elements.`);
    for (const product of products) {
      let availableItems = [];
      for (const [i, gridItem] of gridItems.entries()) {
        // Highlight every product-grid-item visited
        await gridItem.evaluate(el => { el.style.border = '2px solid red'; });
        // Check for product name match in product-grid-item
        const textContent = await gridItem.evaluate(el => el.textContent);
        if (textContent && textContent.includes(product)) {
          // Check if this product-grid-item has 'outofstock' class
          const hasOutOfStockClass = await gridItem.evaluate(el => el.classList.contains('outofstock'));
          console.log(`Product '${product}' in grid item ${i}: has outofstock class?`, hasOutOfStockClass);
          if (!hasOutOfStockClass) {
            // Extract item name from .product-grid-name a
            const nameHandle = await gridItem.$('.product-grid-name a');
            let itemName = '';
            if (nameHandle) {
              itemName = await nameHandle.evaluate(el => el.textContent.trim());
            }
            availableItems.push(itemName);
            console.log(`Product '${product}' in grid item ${i}: Available, Name: ${itemName}`);
            // Highlight the available product-grid-item for debugging
            await gridItem.evaluate(el => { el.style.border = '2px solid orange'; });
          } else {
            console.log(`Product '${product}' in grid item ${i}: Not Available (Out of Stock)`);
          }
        }
      }
      result.push({ product, availableCount: availableItems.length, availableItems });
      console.log(`Result for '${product}': Available=${availableItems.length}, Items: ${availableItems.join(', ')}`);
    }
  } catch (error) {
    console.error('Scraping error:', error.message);
    result = products.map(product => ({ product, available: false, error: error.message }));
  } finally {
    await browser.close();
  }
  return result;
}
