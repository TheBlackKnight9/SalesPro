const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12);
  const office = await prisma.office.findFirst();
  
  const agent = await prisma.user.upsert({
    where: { email: 'testagent@salespro.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'testagent@salespro.com',
      passwordHash: hashedPassword,
      name: 'Test Agent',
      role: 'AGENT',
      officeId: office.id,
      phone: '+1112223333',
    },
  });
  
  console.log('Test Agent created:', agent.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
