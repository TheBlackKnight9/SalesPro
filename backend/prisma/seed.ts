import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create default Organization
  const org = await prisma.organization.upsert({
    where: { id: "default-org" },
    update: {
      name: "SalesPro Corp",
    },
    create: {
      id: "default-org",
      name: "SalesPro Corp",
    },
  });
  console.log(`Created default Organization: ${org.name} (${org.id})`);

  // 2. Create default office
  const office = await prisma.office.upsert({
    where: { id: "default-hq" },
    update: {
      name: "SalesPro HQ",
      address: "123 Main Street",
    },
    create: {
      id: "default-hq",
      name: "SalesPro HQ",
      address: "123 Main Street",
    },
  });
  console.log(`Created default Office: ${office.name} (${office.id})`);

  // 3. Hash password
  const hashedPassword = await bcrypt.hash("password123", 12);

  // 4. Create Super Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@salespro.com" },
    update: {
      password: hashedPassword,
      name: "System Admin",
      role: "SUPER_ADMIN",
      officeId: office.id,
      organizationId: org.id,
    },
    create: {
      email: "admin@salespro.com",
      password: hashedPassword,
      name: "System Admin",
      role: "SUPER_ADMIN",
      officeId: office.id,
      organizationId: org.id,
      phone: "+1234567890",
    },
  });
  console.log(`Upserted Super Admin: ${admin.email}`);

  // 5. Create Manager user
  const manager = await prisma.user.upsert({
    where: { email: "manager@salespro.com" },
    update: {
      password: hashedPassword,
      name: "Office Manager",
      role: "MANAGER",
      officeId: office.id,
      organizationId: org.id,
    },
    create: {
      email: "manager@salespro.com",
      password: hashedPassword,
      name: "Office Manager",
      role: "MANAGER",
      officeId: office.id,
      organizationId: org.id,
      phone: "+1234567891",
    },
  });
  console.log(`Upserted Manager: ${manager.email}`);

  // 6. Create Agent user
  const agent = await prisma.user.upsert({
    where: { email: "agent@salespro.com" },
    update: {
      password: hashedPassword,
      name: "Sales Agent",
      role: "AGENT",
      officeId: office.id,
      organizationId: org.id,
    },
    create: {
      email: "agent@salespro.com",
      password: hashedPassword,
      name: "Sales Agent",
      role: "AGENT",
      officeId: office.id,
      organizationId: org.id,
      phone: "+1234567892",
    },
  });
  console.log(`Upserted Agent: ${agent.email}`);

  console.log("✅ Seed successful!");
  console.log("-----------------------------------------");
  console.log(`Super Admin Email: ${admin.email}`);
  console.log(`Manager Email:     ${manager.email}`);
  console.log(`Agent Email:       ${agent.email}`);
  console.log(`Default Password:  password123`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
