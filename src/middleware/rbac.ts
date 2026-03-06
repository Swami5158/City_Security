import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { dynamicPermissionService } from '../services/dynamicPermissionService';

export const authorize = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { role, permissions } = req.user;

    // 1. Basic Permission Check
    if (!permissions.includes(permission)) {
      (req as any).deniedReason = `Missing required permission: ${permission}`;
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        requiredPermission: permission,
        yourPermissions: permissions
      });
    }

    // 2. Dynamic Time-Based Rules
    const isAllowedTime = dynamicPermissionService.checkTimeBasedAccess(role, permission);
    if (!isAllowedTime) {
      (req as any).deniedReason = `Action ${permission} is restricted for role ${role} at this time.`;
      return res.status(403).json({
        error: 'Forbidden: Time-based restriction',
        reason: (req as any).deniedReason
      });
    }

    next();
  };
};
