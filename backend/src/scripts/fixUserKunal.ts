import { prisma } from "../config/prisma";

async function main() {
  try {
    const kunal = await prisma.user.findFirst({
      where: { email: "kunal@gmail.com" }
    });

    if (!kunal) {
      console.log("No user with email kunal@gmail.com found!");
      return;
    }

    const updated = await prisma.user.update({
      where: { id: kunal.id },
      data: {
        organizationId: "cmpi9scox0000psvqdmficl2w"
      }
    });

    console.log("Successfully linked kunal@gmail.com to Bajaj's Organization:", updated.organizationId);
  } catch (error) {
    console.error("Error linking Kunal:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
