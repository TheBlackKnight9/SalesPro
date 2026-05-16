import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting Data Migration: Customer -> Lead Reset...");

  const customers = await prisma.customer.findMany({
    include: { lead: true }
  });

  console.log(`Found ${customers.length} customers to reset.`);

  for (const customer of customers) {
    console.log(`Resetting customer: ${customer.firstName} ${customer.lastName || ""} (Lead ID: ${customer.leadId})`);
    
    await prisma.$transaction([
      // 1. Reset Lead status and conversion flag
      prisma.lead.update({
        where: { id: customer.leadId },
        data: {
          isConverted: false,
          convertedAt: null,
          status: "NEW", // Valid status from enum
        }
      }),
      // 2. Delete the Customer record
      prisma.customer.delete({
        where: { id: customer.id }
      })
    ]);
  }

  console.log("✅ Data Migration Complete. All customers have been reset to leads.");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
