import express from 'express';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';
import { reportService } from '../services/reportService';

const router = express.Router();

router.get('/', authorize('reports:view'), async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const reports = await reportService.getReports(Number(page), Number(limit));
  res.json(reports);
});

router.post('/generate', authorize('users:manage'), async (req, res) => {
  const report = await reportService.generateDailyReport((req as any).user.email);
  res.json(report);
});

export default router;
