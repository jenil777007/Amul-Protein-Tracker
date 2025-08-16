import 'dotenv/config';
import { scrapeAvailability } from './scraper.js';
import { sendTelegramNotification } from './notifier.js';
import { logAvailability } from './logger.js';

const botToken = process.env.APT_TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.APT_TELEGRAM_CHAT_ID;
const products = process.env.APT_PRODUCTS ? process.env.APT_PRODUCTS.split(',').map(p => p.trim()) : [];
const pincodes = process.env.APT_PINCODES ? process.env.APT_PINCODES.split(',').map(p => p.trim()) : [];

export async function main() {
        for (const pincode of pincodes) {
            const timestamp = new Date().toISOString();
            const result = await scrapeAvailability({ products, pincode });
            // Log the final scraping result
            console.log('Final scraping result:', JSON.stringify(result, null, 2));
            const availableProducts = result.filter(r => r.availableCount && r.availableCount > 0);
            let notificationSent = false;
            let error = null;
            if (availableProducts.length > 0) {
                // Compose message
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
                notificationSent = await sendTelegramNotification(
                    botToken,
                    telegramChatId,
                    message
                );
                console.log('Notification sent:', notificationSent);
            } else {
                console.log('No available products. No notification sent.');
            }
            // Log result
            logAvailability({
                timestamp,
                pincode,
                products: result,
                notificationSent,
                error
            });
        }
}
main();
