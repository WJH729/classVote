import 'dotenv/config';
import * as crypto from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function generateSecretKey(): string {
  return `admin-${crypto.randomBytes(24).toString('hex')}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  try {
    const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com').toLowerCase();
    
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      console.error('Admin user not found. Please run seed.ts first.');
      return;
    }

    if (admin.secretKey) {
      console.log(`Admin already has a secret key: ${admin.secretKey}`);
      return;
    }

    const secretKey = generateSecretKey();
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { secretKey },
    });

    console.log(`\n========================================`);
    console.log(`管理员密钥已生成:`);
    console.log(secretKey);
    console.log(`========================================\n`);
    console.log(`请妥善保管此密钥，用于管理员登录。`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
