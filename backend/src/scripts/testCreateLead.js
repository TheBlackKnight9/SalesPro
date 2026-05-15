const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testCreate() {
  try {
    console.log('Attempting to create lead...');
    const lead = await prisma.lead.create({
      data: {
        firstName: 'Test',
        phone: '1234567890',
        officeId: 'default-hq',
        createdById: 'clm5id50i000035760g9n8zrv', // I need a valid user ID here
        source: 'WEBSITE'
      }
    });
    console.log('Lead created:', lead.id);
  } catch (err) {
    console.error('ERROR_START');
    console.error(err);
    console.error('ERROR_END');
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();
