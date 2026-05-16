import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const leadCount = await prisma.lead.count();
  const customerCount = await prisma.customer.count();
  const quotationCount = await prisma.quotation.count();
  const userCount = await prisma.user.count();

  console.log({
    leadCount,
    customerCount,
    quotationCount,
    userCount
  });

  const leads = await prisma.lead.findMany({ take: 5, select: { id: true, isConverted: true, agentId: true, officeId: true } });
  console.log("Sample Leads:", leads);

  const users = await prisma.user.findMany({ take: 5, select: { id: true, role: true, officeId: true } });
  console.log("Sample Users:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
