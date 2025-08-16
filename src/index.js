
import 'dotenv/config';
import { scrapeAvailabilities } from './scraper.js';
import { sendTelegramNotification } from './notifier.js';
import { logAvailabilities } from './logger.js';
import logger from './appLogger.js';


const botToken = process.env.APT_TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.APT_TELEGRAM_CHAT_ID;
const products = process.env.APT_PRODUCTS ? process.env.APT_PRODUCTS.split(',').map(p => p.trim()) : [];
const pincodes = process.env.APT_PINCODES ? process.env.APT_PINCODES.split(',').map(p => p.trim()) : [];

function logInfo(message, ...args) {
    logger.info(`[INDEX] ${message} ${args.length ? args.map(a => JSON.stringify(a)).join(' ') : ''}`);
}

function formatNotificationMessage(pincode, availableProducts) {
    let message = `*Product Availability for Pincode ${pincode}*\n\n`;
    for (const r of availableProducts) {
        message += `- ${r.product}: ${r.availableCount} available\n`;
        if (r.availableItems && r.availableItems.length > 0) {
            message += `  Items:\n`;
            for (const item of r.availableItems) {
                message += `    - ${item}\n`;
            }
        }
    }
    return message;
}

async function processPincode(pincode) {
    const timestamp = new Date().toISOString();
    logInfo(`Processing pincode: ${pincode}`);
    const result = await scrapeAvailabilities({ products, pincode });
    logInfo('Scraping result:', JSON.stringify(result, null, 2));
    const availableProducts = result.filter(r => r.availableCount && r.availableCount > 0);
    let notificationSent = false;
    let error = null;
    if (availableProducts.length > 0) {
        const message = formatNotificationMessage(pincode, availableProducts);
        notificationSent = await sendTelegramNotification(
            botToken,
            telegramChatId,
            message
        );
        logInfo('Notification sent:', notificationSent);
    } else {
        logInfo('No available products. No notification sent.');
    }
    logAvailabilities({
        timestamp,
        pincode,
        products: result,
        notificationSent,
        error
    });
}


export async function main() {
    logInfo('Starting Amul Protein Tracker');
    for (const pincode of pincodes) {
        await processPincode(pincode);
    }
    logInfo('All pincodes processed. Exiting.');
}

main();
