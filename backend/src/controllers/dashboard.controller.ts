import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../types/shared.types";
import { UserRole } from "@prisma/client";

// Helper function to format enums
function formatEnum(val?: string) {
  if (!val) return "";
  if (/[a-z]/.test(val) && !val.includes("_")) {
    return val;
  }
  return val
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ISO week number utility
function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is missing." });
    }
    const role = req.user?.role;
    const userId = req.user?.userId;

    const leadWhereClause: any = { organizationId: orgId };
    
    if (role === UserRole.AGENT && userId) {
      leadWhereClause.agentId = userId;
    } else if (role === UserRole.MANAGER && req.user?.officeId) {
      const officeId = req.user.officeId;
      leadWhereClause.officeId = officeId;
    }

    const customerWhereClause: any = {
      isActive: true,
      lead: leadWhereClause
    };

    const quotationWhereClause: any = {
      organizationId: orgId,
      status: { in: ["DRAFT", "SENT", "ACCEPTED"] },
      OR: [
        { lead: leadWhereClause },
        { customer: { lead: leadWhereClause } }
      ]
    };

    const totalLeads = await prisma.lead.count({ where: leadWhereClause });
    const activeCustomers = await prisma.customer.count({ where: customerWhereClause });
    const quotations = await prisma.quotation.findMany({
      where: quotationWhereClause,
      select: { totalAmount: true }
    });
    
    let pipelineValue = 0;
    quotations.forEach(q => {
      pipelineValue += Number(q.totalAmount || 0);
    });

    return res.status(200).json({
      success: true,
      data: { totalLeads, activeCustomers, pipelineValue, conversionRate: "0%" }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is missing." });
    }
    const role = req.user?.role;
    const userId = req.user?.userId;
    const officeId = req.user?.officeId;

    // Formulate Strict Role-Based Query Constraints (RBAC Isolation)
    const roleFilters: any = { organizationId: orgId };
    if (role === UserRole.AGENT && userId) {
      roleFilters.agentId = userId;
    } else if (role === UserRole.MANAGER && officeId) {
      roleFilters.officeId = officeId;
    }

    // Fetch KPI Summary Metrics Counts Parallelly
    const [newLeads, contactedLeads, qualifiedLeads, negotiationLeads, convertedCustomers, lostLeads, proposalSentLeads] = await Promise.all([
      prisma.lead.count({ where: { ...roleFilters, status: "NEW" } }),
      prisma.lead.count({ where: { ...roleFilters, status: "CONTACTED" } }),
      prisma.lead.count({ where: { ...roleFilters, status: "QUALIFIED" } }),
      prisma.lead.count({ where: { ...roleFilters, status: "NEGOTIATION" } }),
      prisma.customer.count({ where: { lead: roleFilters } }), // Sync with live customer database rows count
      prisma.lead.count({ where: { ...roleFilters, status: "LOST" } }),
      prisma.lead.count({ where: { ...roleFilters, status: "PROPOSAL_SENT" } }),
    ]);

    // Calculate aggregated pipeline value cleanly
    const quotations = await prisma.quotation.findMany({
      where: { lead: { ...roleFilters }, status: { in: ["DRAFT", "SENT", "ACCEPTED"] } },
      select: { totalAmount: true },
    });
    const pipelineSum = quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);

    // Helpers for ISO Week lookback (6 Weeks Window)
    const subWeeks = (date: Date, n: number) => {
      const d = new Date(date);
      d.setDate(d.getDate() - n * 7);
      return d;
    };

    const startOfISOWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const currentPoint = new Date();
    const timelineWeeks = Array.from({ length: 6 }).map((_, idx) => {
      const targetDate = subWeeks(currentPoint, 5 - idx);
      const weekNumber = getISOWeekNumber(targetDate);
      return {
        weekNumber,
        label: `Wk ${weekNumber}`,
        start: startOfISOWeek(targetDate),
        end: new Date(startOfISOWeek(targetDate).getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
        New: 0,
        Interested: 0,
        QuoteSent: 0,
        Converted: 0,
      };
    });

    // Fetch leads within our calendar lookback timeframe
    const baseLeadsTimeline = await prisma.lead.findMany({
      where: {
        ...roleFilters,
        createdAt: { gte: timelineWeeks[0].start, lte: timelineWeeks[5].end },
      },
      select: { status: true, createdAt: true },
    });

    // Map rows into real calendar week baskets explicitly matching chart keys
    baseLeadsTimeline.forEach((lead) => {
      const leadWeek = getISOWeekNumber(new Date(lead.createdAt));
      const targetBasket = timelineWeeks.find((w) => w.weekNumber === leadWeek);
      
      if (targetBasket) {
        const stage = lead.status?.toUpperCase();
        if (stage === "NEW") targetBasket.New++;
        else if (stage === "CONTACTED" || stage === "QUALIFIED") targetBasket.Interested++;
        else if (stage === "PROPOSAL_SENT" || stage === "NEGOTIATION") targetBasket.QuoteSent++;
        else if (stage === "WON" || stage === "CONVERTED") targetBasket.Converted++;
      }
    });

    // Clean payload response structure
    const payload = {
      kpis: {
        newLeads: newLeads,
        hotLeads: contactedLeads + qualifiedLeads,
        converted: convertedCustomers,
        pipelineValue: pipelineSum,
      },
      stageBreakdown: {
        New: newLeads,
        Interested: contactedLeads,
        Qualified: qualifiedLeads,
        QuoteSent: proposalSentLeads,
        Negotiation: negotiationLeads,
        Converted: convertedCustomers,
      },
      funnelChartData: timelineWeeks.map((w) => ({
        name: w.label,
        New: w.New,
        Interested: w.Interested,
        QuoteSent: w.QuoteSent,
        Converted: w.Converted,
      })),
    };

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
