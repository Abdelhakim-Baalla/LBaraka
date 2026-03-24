import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log(`Users count: ${count}`);
  console.log('Users:', users);
  await prisma.$disconnect();
}

main();
