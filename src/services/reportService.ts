import prisma from '../config/database';

class ReportService {
  async generateDailyReport(generatedBy: string = 'SYSTEM') {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const logs = await prisma.auditLog.findMany({
      where: { timestamp: { gte: yesterday } }
    });

    const summary = {
      totalRequests: logs.length,
      failedAttempts: logs.filter(l => !l.success).length,
      emergencyOverrides: logs.filter(l => l.isEmergency).length,
      flaggedEvents: logs.filter(l => l.isFlagged).length,
      uniqueUsers: new Set(logs.map(l => l.userId)).size
    };

    const actionCounts: any = {};
    logs.forEach(l => {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });

    const reportData = {
      actionBreakdown: actionCounts,
      topUsers: this.getTopUsers(logs),
      recentFlagged: logs.filter(l => l.isFlagged).slice(0, 5)
    };

    return prisma.securityReport.create({
      data: {
        period: 'Last 24 Hours',
        summary: JSON.stringify(summary),
        reportData: JSON.stringify(reportData),
        generatedBy
      }
    });
  }

  private getTopUsers(logs: any[]) {
    const userCounts: any = {};
    logs.forEach(l => {
      userCounts[l.userEmail] = (userCounts[l.userEmail] || 0) + 1;
    });
    return Object.entries(userCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }));
  }

  async getReports(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.securityReport.findMany({
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' }
      }),
      prisma.securityReport.count()
    ]);

    return {
      items: items.map(i => ({
        ...i,
        summary: JSON.parse(i.summary),
        reportData: JSON.parse(i.reportData)
      })),
      total,
      page,
      limit
    };
  }
}

export const reportService = new ReportService();
