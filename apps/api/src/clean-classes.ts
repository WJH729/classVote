import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  
  try {
    for (let i = 1; i <= 12; i++) {
      const classId = String(i).padStart(2, '0');
      const classEmail = `class${classId}@vote.system`;
      
      const existing = await prisma.adminUser.findUnique({ where: { email: classEmail } });
      if (existing) {
        await prisma.$executeRawUnsafe(`DELETE FROM "AdminRefreshToken" WHERE "adminUserId" = '${existing.id}'`);
        await prisma.$executeRawUnsafe(`DELETE FROM "AdminUserRole" WHERE "adminUserId" = '${existing.id}'`);
        await prisma.$executeRawUnsafe(`DELETE FROM "AdminUser" WHERE "id" = '${existing.id}'`);
        console.log(`Deleted old class account: ${classEmail}`);
      }
    }
    
    console.log('Cleaned up old class accounts. Run seed.ts to recreate them.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
