import { prisma } from "../config/prisma";

async function main() {
  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      office: { select: { name: true } },
      agent: { select: { name: true } }
    }
  });
  console.log("ALL LEADS IN DB:");
  console.table(leads);
}

main().catch(err => console.error(err));
