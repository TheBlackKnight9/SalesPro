import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create default office
  const office = await prisma.office.upsert({
    where: { id: "default-hq" },
    update: {},
    create: {
      id: "default-hq",
      name: "SalesPro HQ",
      address: "123 Main Street",
    },
  });

  // 2. Hash password
  const hashedPassword = await bcrypt.hash("password123", 12);

  // 3. Create Super Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@salespro.com" },
    update: {},
    create: {
      email: "admin@salespro.com",
      passwordHash: hashedPassword,
      name: "System Admin",
      role: "SUPER_ADMIN",
      officeId: office.id,
      phone: "+1234567890",
    },
  });

  console.log("✅ Seed successful!");
  console.log("-----------------------------------------");
  console.log(`Login Email:    ${admin.email}`);
  console.log(`Login Password: password123`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
