import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const assetSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  location: z.string().min(1),
  district: z.string().min(1),
  status: z.string().min(1),
  config: z.any().optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  roleId: z.string().uuid(),
  district: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const emergencyOverrideSchema = z.object({
  assetId: z.string().uuid(),
  action: z.enum(['OPEN', 'CLOSE', 'RESET']),
  password: z.string(),
});
