import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Prevent multiple Prisma instances in hot-reload Next.js dev server
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export async function POST(request: Request) {
  try {
    const { companyName, name, email, password } = await request.json();

    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { message: "companyName, name, email, and password are required." },
        { status: 400 }
      );
    }

    // Ensure bcrypt hashing runs before the transaction
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create the isolated corporate workspace
      const newOrg = await tx.organization.create({
        data: {
          name: companyName, // e.g., "Pratik's Agency"
        },
      });

      // Step 2: Create the owner profile explicitly tied to the new workspace
      const newUser = await tx.user.create({
        data: {
          name: name,
          email: email.toLowerCase().trim(),
          password: hashedPassword, // Ensure bcrypt/argon2 hashing runs before this
          role: 'SUPER_ADMIN',      // Explicitly set their role as the global account owner
          organizationId: newOrg.id, // Tie them directly to their brand-new isolated workspace
        },
      });

      return { newOrg, newUser };
    });

    return NextResponse.json({
      message: "Organization and SUPER_ADMIN registered successfully.",
      data: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Next.js Isolated Signup Transaction Error:", error);
    return NextResponse.json(
      { message: error.message || "Signup failed." },
      { status: 500 }
    );
  }
}
