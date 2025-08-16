
import cron from 'node-cron';
import { main } from './index.js';
import logger from './appLogger.js';

// Schedule to run every 30 minutes

logger.info('[CRON] Scheduling product availability checks every 30 minutes.');
cron.schedule('*/30 * * * *', async () => {
  logger.info(`[CRON] Triggered at ${new Date().toISOString()}`);
  try {
    await main();
  logger.info(`[CRON] Availability check completed at ${new Date().toISOString()}`);
  } catch (error) {
  logger.error(`[CRON] Error during availability check: ${error.message}`);
  }
});
