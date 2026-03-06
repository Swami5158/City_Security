import fs from 'fs';
import path from 'path';
import prisma from '../config/database';

interface ThreatRule {
  id: string;
  description: string;
  condition: {
    action?: string;
    success?: boolean;
    threshold?: number;
    windowMinutes?: number;
    outsideHours?: { start: number; end: number };
  };
  response: string;
  severity: string;
}

class ThreatDetectionService {
  private rules: ThreatRule[] = [];

  constructor() {
    this.loadRules();
  }

  private loadRules() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'threat-rules.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      this.rules = config.rules;
    } catch (error) {
      console.error('Failed to load threat rules:', error);
    }
  }

  async analyze(log: any) {
    for (const rule of this.rules) {
      let triggered = false;

      if (rule.id === 'BRUTE_FORCE' && log.action === 'LOGIN_FAILED') {
        const windowStart = new Date(Date.now() - (rule.condition.windowMinutes! * 60 * 1000));
        const count = await prisma.auditLog.count({
          where: {
            userEmail: log.userEmail,
            action: 'LOGIN_FAILED',
            timestamp: { gte: windowStart }
          }
        });
        if (count >= rule.condition.threshold!) triggered = true;
      }

      if (rule.id === 'REPEATED_FORBIDDEN' && !log.success) {
        const windowStart = new Date(Date.now() - (rule.condition.windowMinutes! * 60 * 1000));
        const count = await prisma.auditLog.count({
          where: {
            userId: log.userId,
            success: false,
            timestamp: { gte: windowStart }
          }
        });
        if (count >= rule.condition.threshold!) triggered = true;
      }

      if (rule.id === 'AFTER_HOURS_EMERGENCY' && log.isEmergency) {
        const hour = new Date().getHours();
        if (hour < rule.condition.outsideHours!.start || hour >= rule.condition.outsideHours!.end) {
          triggered = true;
        }
      }

      if (triggered) {
        await this.handleTrigger(rule, log);
      }
    }
  }

  private async handleTrigger(rule: ThreatRule, log: any) {
    console.warn(`THREAT DETECTED: ${rule.id} for user ${log.userEmail}`);

    if (rule.response === 'AUTO_LOCK_USER') {
      await prisma.user.update({
        where: { id: log.userId },
        data: { isActive: false }
      });
    }

    if (rule.response === 'FLAG_AND_ALERT' || rule.response === 'ALERT_SUPER_ADMIN') {
      await prisma.auditLog.update({
        where: { id: log.id },
        data: { isFlagged: true }
      });

      await prisma.threatAlert.create({
        data: {
          type: rule.id,
          severity: rule.severity,
          userId: log.userId,
          userEmail: log.userEmail,
          description: rule.description
        }
      });
    }
  }

  async getActiveAlerts() {
    return prisma.threatAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const threatDetectionService = new ThreatDetectionService();
