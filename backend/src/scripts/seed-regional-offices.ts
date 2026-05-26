import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding regional offices...");

  // 1. Create or upsert regional offices
  const officesData = [
    { id: "default-hq", name: "SalesPro HQ", address: "123 Main Street", city: "Delhi", state: "Delhi", monthlyTarget: 8000000 },
    { id: "jaipur", name: "Jaipur Office", address: "456 Tonk Road", city: "Jaipur", state: "Rajasthan", monthlyTarget: 5000000 },
    { id: "delhi", name: "Delhi Office", address: "789 Connaught Place", city: "Delhi", state: "Delhi", monthlyTarget: 10000000 },
    { id: "mumbai", name: "Mumbai Office", address: "101 Nariman Point", city: "Mumbai", state: "Maharashtra", monthlyTarget: 15000000 },
  ];

  const offices: any[] = [];
  for (const data of officesData) {
    const office = await prisma.office.upsert({
      where: { id: data.id },
      update: { name: data.name, city: data.city, state: data.state, monthlyTarget: data.monthlyTarget },
      create: data,
    });
    offices.push(office);
    console.log(`Officeupserted: ${office.name} (${office.id})`);
  }

  // 2. Fetch all users
  const users = await prisma.user.findMany({
    where: { role: { not: "SUPER_ADMIN" } },
  });
  console.log(`Found ${users.length} non-admin users to distribute.`);

  // Distribute users across offices (jaipur, delhi, mumbai, default-hq)
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const office = offices[i % offices.length];
    await prisma.user.update({
      where: { id: user.id },
      data: { officeId: office.id },
    });
    console.log(`Assigned User ${user.name} to ${office.name}`);
  }

  // 3. Fetch all leads
  const leads = await prisma.lead.findMany();
  console.log(`Found ${leads.length} leads to distribute.`);

  // Distribute leads across offices
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const office = offices[i % offices.length];
    await prisma.lead.update({
      where: { id: lead.id },
      data: { officeId: office.id },
    });
  }
  console.log(`Distributed all leads.`);

  // 4. Fetch all customers
  const customers = await prisma.customer.findMany();
  console.log(`Found ${customers.length} customers to distribute.`);

  // Distribute customers across offices
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const office = offices[i % offices.length];
    await prisma.customer.update({
      where: { id: customer.id },
      data: { officeId: office.id },
    });
  }
  console.log(`Distributed all customers.`);

  console.log("✅ Regional office seeding and data distribution complete!");
}

main()
  .catch((e) => {
    console.error("Error during regional seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
