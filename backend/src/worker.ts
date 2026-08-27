import cron from 'node-cron';
import dotenv from 'dotenv';
import { monitoringService } from './modules/monitoring/monitoring.service';

dotenv.config();

console.log('Worker started, checking every 10 seconds for due monitors...');

cron.schedule('*/10 * * * * *', async () => {
  try {
    const count = await monitoringService.runDueChecks();
    if (count > 0) {
      console.log(`Checked ${count} monitor(s)`);
    }
  } catch (error) {
    console.error('Error running checks:', error);
  }
});