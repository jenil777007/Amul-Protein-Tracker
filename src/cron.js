import cron from 'node-cron';
import { main } from './index.js';

// Schedule to run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  await main();
  console.log('Availability check completed at', new Date().toISOString());
});

console.log('Scheduled product availability checks every 30 minutes.');
