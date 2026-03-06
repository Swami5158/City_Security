import express from 'express';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';

const router = express.Router();

router.get('/', authorize('audit:view'), async (req, res) => {
  const { page = 1, limit = 20, userEmail, action, isEmergency, isFlagged } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (userEmail) where.userEmail = { contains: String(userEmail) };
  if (action) where.action = String(action);
  if (isEmergency === 'true') where.isEmergency = true;
  if (isFlagged === 'true') where.isFlagged = true;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ]);

  res.json({
    items: items.map(i => ({
      ...i,
      beforeState: i.beforeState ? JSON.parse(i.beforeState) : null,
      afterState: i.afterState ? JSON.parse(i.afterState) : null
    })),
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

export default router;
