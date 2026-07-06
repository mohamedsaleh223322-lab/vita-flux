import cron from 'node-cron';
import { disposeExpiredBlood } from '../services/inventoryService.js';
import { logger } from '../utils/logger.js';

export const initCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running auto-expiry cron job...');
    try {
      const result = await disposeExpiredBlood();
      logger.info(`Cron job finished. Disposed ${result.count} batches.`);
    } catch (err) {
      logger.error('Error in auto-expiry cron job:', err);
    }
  });
  
  logger.info('Cron jobs initialized');
};
