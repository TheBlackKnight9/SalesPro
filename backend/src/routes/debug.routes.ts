import { Router } from "express";
import prisma from "../config/prisma";

const router = Router();

router.get("/debug-counts", async (req, res) => {
  try {
    const leadCount = await prisma.lead.count();
    const customerCount = await prisma.customer.count();
    const quotationCount = await prisma.quotation.count();
    const userCount = await prisma.user.count();

    const sampleLeads = await prisma.lead.findMany({ take: 5, select: { id: true, isConverted: true, agentId: true, officeId: true } });
    const sampleUsers = await prisma.user.findMany({ take: 5, select: { id: true, role: true, officeId: true } });

    res.json({
      leadCount,
      customerCount,
      quotationCount,
      userCount,
      sampleLeads,
      sampleUsers
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
