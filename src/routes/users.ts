import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';
import { userSchema } from '../utils/validators';

const router = express.Router();

router.get('/', authorize('users:manage'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/', authorize('users:manage'), async (req, res) => {
  try {
    const data = userSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
        district: data.district,
        isActive: data.isActive ?? true
      }
    });
    
    const { password, ...u } = user;
    res.status(201).json(u);
  } catch (error) {
    res.status(400).json({ error: 'User creation failed' });
  }
});

router.put('/:id', authorize('users:manage'), async (req, res) => {
  try {
    const data = userSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });

    const { password, ...u } = user;
    res.json(u);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

router.delete('/:id', authorize('users:manage'), async (req, res) => {
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false }
  });
  res.status(204).send();
});

router.get('/roles', authorize('users:manage'), async (req, res) => {
  const roles = await prisma.role.findMany();
  res.json(roles);
});

export default router;
