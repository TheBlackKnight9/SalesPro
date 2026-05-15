import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLeads() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, firstName: true, phone: true, createdAt: true }
  });
  console.log(JSON.stringify(leads, null, 2));
}

checkLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
