import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/database';
import { threatDetectionService } from '../services/threatDetectionService';

export const audit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next();

  const { id: userId, email: userEmail, role } = req.user;
  const endpoint = req.originalUrl;
  const action = req.method;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  let beforeState: any = null;

  // Capture before state for mutations
  if (['PUT', 'PATCH', 'DELETE'].includes(action)) {
    const resourceId = req.params.id || req.body.id || req.body.assetId;
    if (resourceId) {
      if (endpoint.includes('/infrastructure')) {
        beforeState = await prisma.infrastructureAsset.findUnique({ where: { id: resourceId } });
      } else if (endpoint.includes('/users')) {
        beforeState = await prisma.user.findUnique({ where: { id: resourceId } });
      }
    }
  }

  const originalSend = res.send;
  res.send = function (body) {
    const success = res.statusCode >= 200 && res.statusCode < 300;
    const deniedReason = (req as any).deniedReason || null;

    // Async audit logging to not block response
    prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        role,
        endpoint,
        action: (req as any).auditAction || action,
        ipAddress,
        userAgent,
        success,
        deniedReason,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: success && !['GET', 'DELETE'].includes(action) ? body : null,
        isEmergency: (req as any).isEmergency || false,
      }
    }).then(log => {
      threatDetectionService.analyze(log);
    }).catch(err => console.error('Audit logging failed:', err));

    return originalSend.apply(res, arguments as any);
  };

  next();
};
