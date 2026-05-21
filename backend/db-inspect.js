require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, officeId: true }
  });
  console.log(users);

  console.log("\n=== ALL QUOTATIONS ===");
  const quotations = await prisma.quotation.findMany({
    select: {
      id: true,
      quotationNumber: true,
      status: true,
      totalAmount: true,
      leadId: true,
      customerId: true,
      createdById: true,
      createdBy: {
        select: {
          name: true,
          officeId: true
        }
      }
    }
  });
  console.log(quotations);
  
  console.log("\n=== SUMMARY OF ACTIVE PIPELINE ===");
  const sumVal = quotations
    .filter(q => ["DRAFT", "SENT", "ACCEPTED"].includes(q.status))
    .reduce((acc, q) => acc + Number(q.totalAmount), 0);
  console.log("Total active pipeline (Draft, Sent, Accepted):", sumVal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
