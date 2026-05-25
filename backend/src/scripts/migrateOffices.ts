import prisma from "../config/prisma";

async function main() {
  try {
    const firstOrg = await prisma.organization.findFirst();
    if (!firstOrg) {
      console.log("No organization found to backpopulate.");
      return;
    }

    const result = await prisma.office.updateMany({
      where: { organizationId: null },
      data: { organizationId: firstOrg.id }
    });

    console.log(`Successfully backpopulated ${result.count} offices to organization: ${firstOrg.name} (${firstOrg.id})`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
