const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to database...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Total users: ${userCount}`);
    const firstUser = await prisma.user.findFirst({ select: { id: true, email: true } });
    console.log('Sample User:', firstUser);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
