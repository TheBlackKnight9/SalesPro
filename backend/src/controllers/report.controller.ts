import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../types/shared.types";
import { UserRole } from "@prisma/client";

const getStartDate = (range?: string) => {
  const now = new Date();
  if (range === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (range === "last_30_days") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (range === "this_quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), quarter * 3, 1);
  }
  return null;
};

export const getAnalyticsReport = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const userRole = req.user?.role;
    const userOfficeId = req.user?.officeId;
    const userId = req.user?.userId;

    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is missing in session." });
    }

    // Filters from query
    const dateRange = req.query.dateRange as string || "this_month";
    const filterOfficeId = req.query.officeId as string || undefined;
    const filterAgentId = req.query.agentId as string || undefined;

    // Strict dynamic scoping:
    // Agents see only their own data
    // Managers see only their office's data
    let finalOfficeId = filterOfficeId;
    let finalAgentId = filterAgentId;

    if (userRole === UserRole.AGENT) {
      finalAgentId = userId;
      finalOfficeId = userOfficeId || undefined;
    } else if (userRole === UserRole.MANAGER) {
      finalOfficeId = userOfficeId || undefined;
    }

    const startDate = getStartDate(dateRange);
    const dateFilter: any = startDate ? { createdAt: { gte: startDate } } : {};
    const taskDateFilter: any = startDate ? { createdAt: { gte: startDate } } : {};

    // ── 1. BASE CLAUSES ─────────────────────────
    const leadWhere: any = { organizationId: orgId, ...dateFilter };
    if (finalOfficeId) leadWhere.officeId = finalOfficeId;
    if (finalAgentId) leadWhere.agentId = finalAgentId;

    const taskWhere: any = { organizationId: orgId, ...taskDateFilter };
    if (finalAgentId) {
      taskWhere.assignedToId = finalAgentId;
    } else if (finalOfficeId) {
      taskWhere.assignedTo = { officeId: finalOfficeId };
    }

    const quoteWhere: any = { organizationId: orgId, ...dateFilter };
    if (finalAgentId) {
      quoteWhere.OR = [
        { createdById: finalAgentId },
        { lead: { agentId: finalAgentId } }
      ];
    } else if (finalOfficeId) {
      quoteWhere.createdBy = { officeId: finalOfficeId };
    }

    // ── 2. Regional Office ROI Ledger (SUPER_ADMIN only) ──
    let officeLedger: any[] = [];
    if (userRole === UserRole.SUPER_ADMIN) {
      const offices = await prisma.office.findMany({
        where: { organizationId: orgId }
      });

      officeLedger = await Promise.all(offices.map(async (office) => {
        const activeLeadsCount = await prisma.lead.count({
          where: {
            officeId: office.id,
            organizationId: orgId,
            status: { notIn: ["WON", "LOST"] },
            ...dateFilter
          }
        });

        const revenueSum = await prisma.quotation.aggregate({
          where: {
            status: "ACCEPTED",
            organizationId: orgId,
            createdBy: { officeId: office.id },
            ...dateFilter
          },
          _sum: { totalAmount: true }
        });
        const revenue = Number(revenueSum._sum.totalAmount || 0);
        const target = office.monthlyTarget || 5000000;
        const progress = target > 0 ? Math.round((revenue / target) * 100) : 0;

        return {
          officeName: office.name,
          activeLeads: activeLeadsCount,
          revenue,
          target,
          progressPercent: progress
        };
      }));
    }

    // ── 3. Agent Performance & Efficiency Matrix ──
    const agents = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: UserRole.AGENT,
        isActive: true,
        ...(finalOfficeId ? { officeId: finalOfficeId } : {})
      },
      select: {
        id: true,
        name: true,
        office: { select: { name: true } }
      }
    });

    const agentMatrix = await Promise.all(agents.map(async (agent) => {
      const assignedCount = await prisma.lead.count({
        where: { agentId: agent.id, organizationId: orgId, ...dateFilter }
      });

      const wonCount = await prisma.lead.count({
        where: { agentId: agent.id, organizationId: orgId, status: "WON", ...dateFilter }
      });

      const closedQuotes = await prisma.quotation.aggregate({
        where: {
          status: "ACCEPTED",
          organizationId: orgId,
          ...dateFilter,
          OR: [
            { createdById: agent.id },
            { lead: { agentId: agent.id } }
          ]
        },
        _sum: { totalAmount: true }
      });
      const closedVolume = Number(closedQuotes._sum.totalAmount || 0);
      const conversionRate = assignedCount > 0 ? Math.round((wonCount / assignedCount) * 100) : 0;

      return {
        agentName: agent.name,
        officeName: agent.office?.name || "HQ",
        assignedLeads: assignedCount,
        conversionRate,
        closedVolume
      };
    }));

    // Sort by revenue volume descending
    agentMatrix.sort((a, b) => b.closedVolume - a.closedVolume);

    // ── 4. Funnel Stage Analysis ──
    const stages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"];
    const funnelAnalysis = await Promise.all(stages.map(async (stage) => {
      const count = await prisma.lead.count({
        where: { ...leadWhere, status: stage }
      });

      const leadsInStage = await prisma.lead.findMany({
        where: { ...leadWhere, status: stage },
        select: {
          budget: true,
          quotations: {
            select: { 
              totalAmount: true,
              status: true
            }
          }
        }
      });

      let stageValue = 0;
      leadsInStage.forEach((lead) => {
        if (stage === "PROPOSAL_SENT") {
          const sentQuotesTotal = lead.quotations
            .filter((q) => q.status === "SENT")
            .reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
          stageValue += sentQuotesTotal;
        } else {
          const leadBudget = Number(lead.budget || 0);
          const quoteTotal = lead.quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
          stageValue += leadBudget > 0 ? leadBudget : quoteTotal;
        }
      });

      return {
        stage,
        count,
        value: stageValue
      };
    }));

    // ── 5. Lead Source Acquisition ROI Audit ──
    const sources = ["WEBSITE", "WHATSAPP", "REFERRAL", "MANUAL", "SOCIAL_MEDIA"];
    const sourceAnalysis = await Promise.all(sources.map(async (source) => {
      const acquired = await prisma.lead.count({
        where: { ...leadWhere, source: source as any }
      });
      const converted = await prisma.lead.count({
        where: { ...leadWhere, source: source as any, status: "WON" }
      });
      
      const quotesSum = await prisma.quotation.aggregate({
        where: {
          status: "ACCEPTED",
          organizationId: orgId,
          lead: { source: source as any },
          ...dateFilter
        },
        _sum: { totalAmount: true }
      });

      return {
        source,
        acquired,
        converted,
        conversionRate: acquired > 0 ? Math.round((converted / acquired) * 100) : 0,
        revenue: Number(quotesSum._sum.totalAmount || 0)
      };
    }));

    // ── 6. Task Velocity & Operational Discipline Log ──
    const totalTasks = await prisma.task.count({ where: taskWhere });
    const completedTasks = await prisma.task.count({
      where: { ...taskWhere, status: "COMPLETED" }
    });
    const overdueTasks = await prisma.task.count({
      where: {
        ...taskWhere,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: new Date() }
      }
    });

    const taskMetrics = {
      totalTasks,
      completedTasks,
      overdueTasks,
      efficiencyRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        officeLedger,
        agentMatrix,
        funnelAnalysis,
        sourceAnalysis,
        taskMetrics
      }
    });
  } catch (error) {
    console.error("Error generating report analytics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

