import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';
import { emergencyOverrideSchema } from '../utils/validators';
import { emergencyLimiter } from '../middleware/rateLimit';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/override', emergencyLimiter, authorize('emergency:override'), async (req: AuthRequest, res) => {
  try {
    const { assetId, action, password } = emergencyOverrideSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const isValid = await bcrypt.compare(password, user!.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Emergency override failed: Invalid password' });
    }

    const asset = await prisma.infrastructureAsset.update({
      where: { id: assetId },
      data: { status: action === 'RESET' ? 'active' : 'offline' }
    });

    (req as any).isEmergency = true;
    (req as any).auditAction = 'EMERGENCY_OVERRIDE';

    res.json({ message: `Emergency ${action} successful`, asset });
  } catch (error) {
    res.status(400).json({ error: 'Invalid emergency request' });
  }
});

export default router;
