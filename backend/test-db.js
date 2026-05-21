require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const leadWhereClause = {};
  const pipelineStages = [
    { status: "NEW", label: "New" },
    { status: "CONTACTED", label: "Contacted" },
    { status: "QUALIFIED", label: "Qualified" },
    { status: "PROPOSAL_SENT", label: "Proposal Sent" },
    { status: "NEGOTIATION", label: "Negotiation" },
    { status: "WON", label: "Won" }
  ];

  const pipelineByStage = await Promise.all(pipelineStages.map(async (stageObj) => {
    const stageQuotations = await prisma.quotation.findMany({
      where: {
        status: { in: ["DRAFT", "SENT", "ACCEPTED"] },
        OR: [
          {
            lead: {
              status: stageObj.status,
              ...leadWhereClause
            }
          },
          {
            customer: {
              lead: {
                status: stageObj.status,
                ...leadWhereClause
              }
            }
          }
        ]
      },
      select: { totalAmount: true }
    });
    const totalValue = stageQuotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
    return { name: stageObj.label, value: totalValue };
  }));

  console.log("Simulated pipelineByStage:", pipelineByStage);
}

main().catch(console.error).finally(() => prisma.$disconnect());
