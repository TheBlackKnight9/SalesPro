const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany();
  const customers = await prisma.customer.findMany();
  console.log('Leads count:', leads.length);
  console.log('Customers count:', customers.length);
  if (leads.length > 0) console.log('Sample Lead:', leads[0]);
  if (customers.length > 0) console.log('Sample Customer:', customers[0]);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
