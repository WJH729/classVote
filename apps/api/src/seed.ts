import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Permissions } from './rbac/permissions';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  try {
    const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com').toLowerCase();
    const password = process.env.ADMIN_SEED_PASSWORD ?? 'admin123456';

    const permissionKeys = Object.values(Permissions);
    for (const key of permissionKeys) {
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: key },
      });
    }

    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Full access' },
    });

    const perms = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: p.id },
      });
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = await prisma.adminUser.create({
        data: { email, passwordHash, displayName: 'Admin' },
      });
      await prisma.adminUserRole.create({
        data: { adminUserId: admin.id, roleId: adminRole.id },
      });
      // eslint-disable-next-line no-console
      console.log(`Seeded admin: ${email}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Admin already exists: ${email}`);
    }

    const classRole = await prisma.role.upsert({
      where: { name: 'class' },
      update: {},
      create: { name: 'class', description: 'Class voting account' },
    });

    const classVotePerm = await prisma.permission.upsert({
      where: { key: Permissions.ClassVote },
      update: {},
      create: { key: Permissions.ClassVote, description: 'Class voting permission' },
    });

    const classStatsPerm = await prisma.permission.upsert({
      where: { key: Permissions.ClassStats },
      update: {},
      create: { key: Permissions.ClassStats, description: 'Class stats permission' },
    });

    for (const p of [classVotePerm, classStatsPerm]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: classRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: classRole.id, permissionId: p.id },
      });
    }

    for (let i = 1; i <= 12; i++) {
      const classId = String(i).padStart(2, '0');
      const classEmail = `class${classId}@vote.system`;
      const classPassword = `class${classId}`;
      const classDisplayName = `班级 ${classId}`;

      const classExisting = await prisma.adminUser.findUnique({ where: { email: classEmail } });
      if (!classExisting) {
        const passwordHash = await bcrypt.hash(classPassword, 10);
        const classUser = await prisma.adminUser.create({
          data: {
            email: classEmail,
            passwordHash,
            displayName: classDisplayName,
            classId,
          },
        });
        await prisma.adminUserRole.create({
          data: { adminUserId: classUser.id, roleId: classRole.id },
        });
        // eslint-disable-next-line no-console
        console.log(`Seeded class account: ${classDisplayName} (${classEmail} / ${classPassword})`);
      }
    }

    const existingSettings = await prisma.siteSettings.findFirst();
    if (!existingSettings) {
      await prisma.siteSettings.create({
        data: { siteUrl: '', extraAllowedOrigins: '' },
      });
      console.log('Seeded site settings (empty defaults)');
    } else {
      console.log('Site settings already exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

