import cron from 'node-cron';
import { main } from './index.js';

// Schedule to run every 30 minutes

console.log('[CRON] Scheduling product availability checks every 30 minutes.');
cron.schedule('*/30 * * * *', async () => {
  console.log(`[CRON] Triggered at ${new Date().toISOString()}`);
  try {
    await main();
    console.log(`[CRON] Availability check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`[CRON] Error during availability check: ${error.message}`);
  }
});
