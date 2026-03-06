import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    district: string | null;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as any;

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: { include: { permissions: true } } }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map(p => p.name),
    district: user.district
  };

  next();
};
