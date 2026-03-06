import { reportService } from '../services/reportService';

export const startReportGeneratorWorker = () => {
  console.log('Starting Report Generator Worker...');
  
  // Run once every 24 hours
  setInterval(async () => {
    try {
      console.log('Generating daily security report...');
      const report = await reportService.generateDailyReport();
      console.log(`Daily report generated: ${report.id}`);
    } catch (error) {
      console.error('Report Generator Worker error:', error);
    }
  }, 24 * 60 * 60 * 1000);
};
