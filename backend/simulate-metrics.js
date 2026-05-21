require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to format enums
function formatEnum(val) {
  if (!val) return "";
  if (/[a-z]/.test(val) && !val.includes("_")) {
    return val;
  }
  return val
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function simulateForUser(user) {
  const role = user.role;
  const userId = user.id;
  const officeId = user.officeId;

  const leadWhereClause = {};
  const quotationWhereClause = { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } };
  
  if (role === "AGENT" && userId) {
    leadWhereClause.agentId = userId;
    quotationWhereClause.OR = [
      { createdById: userId },
      { lead: { agentId: userId } },
      { customer: { lead: { agentId: userId } } }
    ];
  } else if (role === "MANAGER" && officeId) {
    leadWhereClause.officeId = officeId;
    quotationWhereClause.createdBy = { officeId: officeId };
  }

  const newLeads = await prisma.lead.count({ where: { status: "NEW", ...leadWhereClause } });
  const hotLeads = await prisma.lead.count({ where: { status: { in: ["CONTACTED", "QUALIFIED"] }, ...leadWhereClause } });
  const converted = await prisma.lead.count({ where: { status: "WON", ...leadWhereClause } });
  
  const quotations = await prisma.quotation.findMany({
    where: quotationWhereClause
  });
  let pipelineValue = 0;
  quotations.forEach(q => { pipelineValue += Number(q.totalAmount || 0); });

  let managerData = null;
  if (role !== "AGENT") {
    // Pipeline Value by Stage
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
    const totalPipelineFromStage = pipelineByStage.reduce((sum, s) => sum + (s.value || 0), 0);
    managerData = { pipelineByStage, totalPipelineFromStage };
  }

  console.log(`User: ${user.name} (${role}, officeId: ${officeId})`);
  console.log(`  -> kpis.pipelineValue: ${pipelineValue}`);
  if (managerData) {
    console.log(`  -> managerData.totalPipelineFromStage: ${managerData.totalPipelineFromStage}`);
    console.log(`  -> stage values:`, managerData.pipelineByStage.map(s => `${s.name}: ${s.value}`).join(", "));
  }
}

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await simulateForUser(user);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
