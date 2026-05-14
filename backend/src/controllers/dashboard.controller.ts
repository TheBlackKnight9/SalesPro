import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Leads
    const totalLeads = await prisma.lead.count();

    // 2. Active Customers
    const activeCustomers = await prisma.customer.count({
      where: { isActive: true },
    });

    // 3. Pipeline Value (Sum of all Quotations that are pending or accepted)
    // We'll calculate a simple sum for the example
    const quotations = await prisma.quotation.findMany({
      where: { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } }
    });
    
    let pipelineValue = 0;
    quotations.forEach(q => {
      pipelineValue += Number(q.totalAmount || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        activeCustomers,
        pipelineValue,
        conversionRate: "0%" // Placeholder until we have more historical data
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
