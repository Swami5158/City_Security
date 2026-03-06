import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { loginSchema } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } }
    });

    if (!user || !user.isActive) {
      (req as any).auditAction = 'LOGIN_FAILED';
      return res.status(401).json({ error: 'Invalid credentials or account locked' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      (req as any).auditAction = 'LOGIN_FAILED';
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    (req as any).auditAction = 'LOGIN_SUCCESS';

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions.map(p => p.name),
        district: user.district
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

export default router;
