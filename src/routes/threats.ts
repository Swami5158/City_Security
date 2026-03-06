import express from 'express';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';
import { threatDetectionService } from '../services/threatDetectionService';

const router = express.Router();

router.get('/', authorize('audit:view'), async (req, res) => {
  const alerts = await threatDetectionService.getActiveAlerts();
  res.json(alerts);
});

router.put('/:id/resolve', authorize('users:manage'), async (req, res) => {
  const alert = await prisma.threatAlert.update({
    where: { id: req.params.id },
    data: { isResolved: true, resolvedAt: new Date() }
  });
  res.json(alert);
});

export default router;
