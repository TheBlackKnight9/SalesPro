const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const count = await p.lead.count({ where: { isConverted: false } });
  console.log('Active Leads Count:', count);
  const sample = await p.lead.findFirst({ where: { isConverted: false } });
  console.log('Sample Lead:', JSON.stringify(sample, null, 2));
}
run().finally(() => p.$disconnect());
