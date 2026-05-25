import { prisma } from "../config/prisma";

async function main() {
  try {
    const offices = await prisma.office.findMany({
      select: { id: true, name: true }
    });
    console.log("OFFICES:", JSON.stringify(offices, null, 2));

    const userCount = await prisma.user.count();
    console.log("TOTAL_USERS:", userCount);

    const leadCounts = await prisma.lead.groupBy({
      by: ["officeId"],
      _count: { _all: true }
    });
    console.log("LEAD_COUNTS_BY_OFFICE:", JSON.stringify(leadCounts, null, 2));

    const customerCounts = await prisma.customer.groupBy({
      by: ["officeId"],
      _count: { _all: true }
    });
    console.log("CUSTOMER_COUNTS_BY_OFFICE:", JSON.stringify(customerCounts, null, 2));

    const quotationCount = await prisma.quotation.count();
    console.log("TOTAL_QUOTATIONS:", quotationCount);

    const taskCount = await prisma.task.count();
    console.log("TOTAL_TASKS:", taskCount);
  } catch (error) {
    console.error("Error counting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
