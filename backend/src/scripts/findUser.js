const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@salespro.com' }
    });
    console.log('USER_ID:', user.id);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

findUser();
