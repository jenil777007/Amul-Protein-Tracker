

import cron from 'node-cron';
import { main } from './index.js';
import logger from './appLogger.js';

const CRON_SCHEDULE = process.env.APT_CRON_SCHEDULE || '*/30 * * * *';

logger.info(`[CRON] Scheduling product availability checks with schedule: ${CRON_SCHEDULE}`);
cron.schedule(CRON_SCHEDULE, async () => {
  logger.info(`[CRON] Triggered at ${new Date().toISOString()}`);
  try {
    await main();
  logger.info(`[CRON] Availability check completed at ${new Date().toISOString()}`);
  } catch (error) {
  logger.error(`[CRON] Error during availability check: ${error.message}`);
  }
});
