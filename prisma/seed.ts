import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Permissions
  const permissions = [
    'users:manage',
    'infrastructure:view',
    'infrastructure:manage',
    'infrastructure:control',
    'audit:view',
    'emergency:override',
    'reports:view'
  ];

  const permissionRecords = await Promise.all(
    permissions.map(name => 
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: `Permission for ${name}` }
      })
    )
  );

  // Roles
  const roles = [
    { name: 'SUPER_ADMIN', perms: permissions },
    { name: 'TRAFFIC_ADMIN', perms: ['infrastructure:view', 'infrastructure:manage', 'infrastructure:control', 'audit:view'] },
    { name: 'MAINTENANCE', perms: ['infrastructure:view'] },
    { name: 'PUBLIC_SAFETY', perms: ['infrastructure:view', 'infrastructure:control', 'emergency:override'] },
    { name: 'AUDITOR', perms: ['infrastructure:view', 'audit:view', 'reports:view'] }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        permissions: {
          set: permissionRecords.filter(p => role.perms.includes(p.name)).map(p => ({ id: p.id }))
        }
      },
      create: {
        name: role.name,
        permissions: {
          connect: permissionRecords.filter(p => role.perms.includes(p.name)).map(p => ({ id: p.id }))
        }
      }
    });
  }

  // Users
  const users = [
    { email: 'super_admin@test.com', role: 'SUPER_ADMIN' },
    { email: 'traffic_admin@test.com', role: 'TRAFFIC_ADMIN' },
    { email: 'maintenance@test.com', role: 'MAINTENANCE', district: 'NORTH' },
    { email: 'public_safety@test.com', role: 'PUBLIC_SAFETY' },
    { email: 'auditor@test.com', role: 'AUDITOR' }
  ];

  for (const user of users) {
    const roleRecord = await prisma.role.findUnique({ where: { name: user.role } });
    if (roleRecord) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          password,
          roleId: roleRecord.id,
          district: user.district || null
        }
      });
    }
  }

  // Infrastructure
  const assetTypes = ['TRAFFIC_LIGHT', 'WATER_PUMP', 'POWER_STATION', 'CCTV_CAMERA', 'FLOOD_SENSOR', 'GAS_PIPELINE', 'WASTE_MANAGEMENT'];
  const districts = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
  const statuses = ['active', 'maintenance', 'offline'];

  for (let i = 0; i < 20; i++) {
    await prisma.infrastructureAsset.create({
      data: {
        name: `${assetTypes[i % assetTypes.length]} ${Math.floor(i / assetTypes.length) + 1}`,
        type: assetTypes[i % assetTypes.length],
        location: `Location ${i + 1}`,
        district: districts[i % districts.length],
        status: statuses[i % statuses.length],
        config: JSON.stringify({ threshold: 50, lastCheck: new Date().toISOString() })
      }
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
