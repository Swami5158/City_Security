import { threatDetectionService } from '../services/threatDetectionService';
import prisma from '../config/database';

export const startThreatDetectionWorker = () => {
  console.log('Starting Threat Detection Worker...');

  setInterval(async () => {
    try {
      console.log('Threat Detection Worker heartbeat');

      // Scan for suspicious activity not caught by real-time middleware
      const windowStart = new Date(Date.now() - (60 * 1000));
      const recentDeletes = await prisma.auditLog.findMany({
        where: {
          action: 'DELETE',
          timestamp: { gte: windowStart }
        }
      });

      if (recentDeletes.length >= 3) {
        console.warn('THREAT DETECTED (Worker): Multiple deletes detected in window');
        await prisma.threatAlert.create({
          data: {
            type: 'MASS_DELETE',
            severity: 'HIGH',
            description: `Detected ${recentDeletes.length} deletes in the last minute.`,
            userId: 'system',
            userEmail: 'system'
          }
        });
      }
    } catch (error) {
      console.error('Threat Detection Worker error:', error);
    }
  }, 60000);
};
