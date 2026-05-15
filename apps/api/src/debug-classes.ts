import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  
  try {
    const classUsers = await prisma.adminUser.findMany({
      where: { classId: { not: null } },
      select: { id: true, email: true, classId: true, displayName: true, isActive: true },
    });
    console.log('Class accounts in database:', JSON.stringify(classUsers, null, 2));
    
    // Also check if permissions are set up
    const classRole = await prisma.role.findUnique({
      where: { name: 'class' },
      include: { permissions: true, users: true },
    });
    console.log('Class role:', JSON.stringify(classRole, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
