import express from 'express';
import prisma from '../config/database';
import { authorize } from '../middleware/rbac';
import { assetSchema } from '../utils/validators';
import { dynamicPermissionService } from '../services/dynamicPermissionService';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authorize('infrastructure:view'), async (req: AuthRequest, res) => {
  const { district, role } = req.user!;
  
  let where: any = {};
  if (!dynamicPermissionService.checkDistrictAccess(req.user, district || '')) {
    where.district = district;
  }

  const assets = await prisma.infrastructureAsset.findMany({ where });
  res.json(assets.map(a => ({ ...a, config: a.config ? JSON.parse(a.config) : null })));
});

router.post('/', authorize('infrastructure:manage'), async (req, res) => {
  try {
    const data = assetSchema.parse(req.body);
    const asset = await prisma.infrastructureAsset.create({
      data: {
        ...data,
        config: data.config ? JSON.stringify(data.config) : null
      }
    });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ error: 'Invalid asset data' });
  }
});

router.put('/:id', authorize('infrastructure:manage'), async (req, res) => {
  try {
    const data = assetSchema.parse(req.body);
    const asset = await prisma.infrastructureAsset.update({
      where: { id: req.params.id },
      data: {
        ...data,
        config: data.config ? JSON.stringify(data.config) : null
      }
    });
    res.json(asset);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

router.delete('/:id', authorize('infrastructure:manage'), async (req, res) => {
  await prisma.infrastructureAsset.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
