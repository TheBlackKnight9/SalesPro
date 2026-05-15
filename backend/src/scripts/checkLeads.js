const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeads() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, firstName: true, phone: true, createdAt: true }
    });
    console.log('RECENT_LEADS_START');
    console.log(JSON.stringify(leads, null, 2));
    console.log('RECENT_LEADS_END');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeads();
