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

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const leadWhereClause: any = {};
    const customerWhereClause: any = { isActive: true };
    const quotationWhereClause: any = { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } };

    if (req.user?.role === UserRole.AGENT) {
      const userId = req.user.userId;
      leadWhereClause.agentId = userId;
      customerWhereClause.lead = { agentId: userId };
      quotationWhereClause.createdById = userId;
    } else if (req.user?.role === UserRole.MANAGER && req.user.officeId) {
      const officeId = req.user.officeId;
      leadWhereClause.officeId = officeId;
      customerWhereClause.officeId = officeId;
      quotationWhereClause.createdBy = { officeId: officeId };
    }

    const totalLeads = await prisma.lead.count({ where: leadWhereClause });
    const activeCustomers = await prisma.customer.count({ where: customerWhereClause });
    const quotations = await prisma.quotation.findMany({
      where: quotationWhereClause
    });
    
    let pipelineValue = 0;
    quotations.forEach(q => {
      pipelineValue += Number(q.totalAmount || 0);
    });

    res.status(200).json({
      success: true,
      data: { totalLeads, activeCustomers, pipelineValue, conversionRate: "0%" }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const role = req.user?.role;
    const userId = req.user?.userId;
    
    // Dynamic base clauses based on UserRole
    const leadWhereClause: any = {};
    const taskWhereClause: any = {};
    const activityWhereClause: any = {};
    const quotationWhereClause: any = { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } };
    
    if (role === UserRole.AGENT && userId) {
      // Agents only see data related to their own assignment
      leadWhereClause.agentId = userId;
      
      taskWhereClause.OR = [
        { assignedToId: userId },
        { createdById: userId }
      ];
      
      activityWhereClause.OR = [
        { performedById: userId },
        { lead: { agentId: userId } },
        { customer: { lead: { agentId: userId } } }
      ];
      
      quotationWhereClause.createdById = userId;
    } else if (role === UserRole.MANAGER && req.user?.officeId) {
      const officeId = req.user.officeId;
      leadWhereClause.officeId = officeId;
      taskWhereClause.assignedTo = { officeId: officeId };
      activityWhereClause.OR = [
        { lead: { officeId: officeId } },
        { customer: { officeId: officeId } }
      ];
      quotationWhereClause.createdBy = { officeId: officeId };
    }
    
    const baseWhereClause = leadWhereClause;
    console.log("Database executing role-based filter:", JSON.stringify(baseWhereClause));

    // KPIs
    const newLeads = await prisma.lead.count({ where: { status: "NEW", ...leadWhereClause } });
    const hotLeads = await prisma.lead.count({ where: { status: { in: ["CONTACTED", "QUALIFIED"] }, ...leadWhereClause } });
    const converted = await prisma.lead.count({ where: { status: "WON", ...leadWhereClause } });
    
    const quotations = await prisma.quotation.findMany({
      where: quotationWhereClause
    });
    let pipelineValue = 0;
    quotations.forEach(q => { pipelineValue += Number(q.totalAmount || 0); });

    const totalLeads = await prisma.lead.count({ where: leadWhereClause });

    // Stage Breakdown: mapped exactly to the specified CRM workflow
    const stages = ["NEW", "CONTACTED", "INTERESTED", "QUOTE_SENT", "NEGOTIATION", "CONVERTED", "LOST"];
    
    const stageToDbStatus = (stage: string): string => {
      switch (stage) {
        case "NEW": return "NEW";
        case "CONTACTED": return "CONTACTED";
        case "INTERESTED": return "QUALIFIED";
        case "QUOTE_SENT": return "PROPOSAL_SENT";
        case "NEGOTIATION": return "NEGOTIATION";
        case "CONVERTED": return "WON";
        case "LOST": return "LOST";
        default: return stage;
      }
    };

    const stageColors = (stage: string): string => {
      switch (stage) {
        case "NEW": return "bg-blue-500";
        case "CONTACTED": return "bg-indigo-500";
        case "INTERESTED": return "bg-purple-500";
        case "QUOTE_SENT": return "bg-amber-500";
        case "NEGOTIATION": return "bg-orange-500";
        case "CONVERTED": return "bg-emerald-500";
        case "LOST": return "bg-rose-500";
        default: return "bg-slate-500";
      }
    };

    const stageBreakdown = await Promise.all(stages.map(async (stageName) => {
      const dbStatus = stageToDbStatus(stageName);
      const count = await prisma.lead.count({
        where: {
          ...leadWhereClause,
          status: dbStatus as any
        }
      });
      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      return {
        name: formatEnum(stageName),
        count,
        percentage,
        color: stageColors(stageName),
        dropoff: "0%"
      };
    }));

    // Lead Sources
    const sourceGroup = await prisma.lead.groupBy({
      by: ['source'],
      where: leadWhereClause,
      _count: { id: true }
    });
    
    const sourceColors = {
      WHATSAPP: "#10B981",
      WEBSITE: "#3B82F6",
      REFERRAL: "#8B5CF6",
      COLD_CALL: "#F59E0B",
      SOCIAL_MEDIA: "#EC4899",
      WALK_IN: "#6366F1",
      MANUAL: "#64748B",
      OTHER: "#94A3B8"
    };
    
    const leadSources = sourceGroup.map(s => {
      const percentage = totalLeads > 0 ? Math.round((s._count.id / totalLeads) * 100) : 0;
      return {
        name: s.source,
        value: s._count.id,
        percentage: `${percentage}%`,
        color: (sourceColors as any)[s.source] || "#94A3B8"
      };
    }).sort((a, b) => b.value - a.value);

    // Hot Leads List
    const hotLeadsData = await prisma.lead.findMany({
      where: { 
        priority: { in: ["HIGH", "URGENT"] }, 
        status: { notIn: ["WON", "LOST", "ON_HOLD"] },
        ...leadWhereClause 
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { quotations: { select: { totalAmount: true }, take: 1, orderBy: { createdAt: "desc" } } }
    });
    
    const hotLeadsList = hotLeadsData.map(l => ({
      name: `${l.firstName} ${l.lastName || ""}`.trim(),
      initials: `${l.firstName.charAt(0)}${l.lastName ? l.lastName.charAt(0) : ""}`,
      subtext: `Updated ${l.updatedAt.toLocaleDateString()}`,
      status: l.status,
      value: l.quotations.length > 0 ? `₹${l.quotations[0].totalAmount}` : "Pending"
    }));

    // Today's Tasks
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const tasks = await prisma.task.findMany({
      where: { 
        dueDate: { gte: startOfDay, lte: endOfDay },
        ...taskWhereClause
      },
      orderBy: { dueDate: "asc" },
      take: 5
    });
    
    const todaysTasks = tasks.map(t => ({
      title: t.title,
      time: t.dueDate ? t.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
      type: "Task",
      status: t.status
    }));

    // Recent Activities
    const activities = await prisma.activity.findMany({
      where: activityWhereClause,
      orderBy: { createdAt: "desc" },
      take: 5
    });
    
    const recentActivities = activities.map(a => ({
      text: a.title,
      time: a.createdAt.toLocaleDateString() === new Date().toLocaleDateString() 
        ? a.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : a.createdAt.toLocaleDateString(),
      color: "bg-blue-500"
    }));

    // Weekly Trend dynamically computed from database records over the past 4 weeks
    const weeklyTrend = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(now.getDate() - (i + 1) * 7);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);

      const wkName = `Wk ${4 - i}`;

      const newCount = await prisma.lead.count({
        where: {
          ...leadWhereClause,
          createdAt: { gte: start, lte: end }
        }
      });

      const contactedCount = await prisma.lead.count({
        where: {
          ...leadWhereClause,
          status: "CONTACTED",
          createdAt: { gte: start, lte: end }
        }
      });

      const quotesCount = await prisma.quotation.count({
        where: {
          ...quotationWhereClause,
          createdAt: { gte: start, lte: end }
        }
      });

      const convertedCount = await prisma.lead.count({
        where: {
          ...leadWhereClause,
          status: "WON",
          convertedAt: { gte: start, lte: end }
        }
      });

      weeklyTrend.push({
        name: wkName,
        New: newCount,
        Contacted: contactedCount,
        Quotes: quotesCount,
        Converted: convertedCount
      });
    }

    // ── Manager/Admin-Only Analytics ─────────────────────────────────────
    let managerData: any = null;
    if (role !== UserRole.AGENT) {
      // 1. Agent Leaderboard
      const agents = await prisma.user.findMany({
        where: { role: UserRole.AGENT, isActive: true },
        select: { id: true, name: true }
      });

      const agentLeaderboard = await Promise.all(agents.map(async (agent) => {
        const activeLeads = await prisma.lead.count({
          where: { agentId: agent.id, status: { notIn: ["WON", "LOST"] } }
        });
        const convertedLeads = await prisma.lead.count({
          where: { agentId: agent.id, status: "WON" }
        });
        const agentQuotations = await prisma.quotation.findMany({
          where: {
            status: { in: ["DRAFT", "SENT", "ACCEPTED"] },
            createdById: agent.id
          },
          select: { totalAmount: true }
        });
        const agentPipeline = agentQuotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
        const needsReview = activeLeads > 10 && convertedLeads === 0;

        return {
          name: agent.name,
          activeLeads,
          convertedLeads,
          pipelineValue: agentPipeline,
          needsReview
        };
      }));

      // Sort by pipeline value descending
      agentLeaderboard.sort((a, b) => b.pipelineValue - a.pipelineValue);

      // 2. Management Alerts
      const managementAlerts: any[] = [];

      // 2a. Stuck high-value deals: HIGH/URGENT priority still in NEW stage
      const stuckDeals = await prisma.lead.findMany({
        where: {
          priority: { in: ["HIGH", "URGENT"] },
          status: "NEW",
          ...leadWhereClause
        },
        include: {
          agent: { select: { name: true } },
          quotations: {
            where: { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } },
            select: { totalAmount: true }
          }
        },
        take: 5
      });
      stuckDeals.forEach(deal => {
        const name = `${deal.firstName} ${deal.lastName || ""}`.trim();
        const dealBudget = deal.quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
        managementAlerts.push({
          type: "stuck_deal",
          text: `Lead ${name} (₹${Number(dealBudget).toLocaleString("en-IN")}) with HIGH priority is still in NEW stage`,
          agent: deal.agent?.name || "Unassigned",
          severity: "danger"
        });
      });

      // 2b. Overdue tasks per agent
      const overdueTasks = await prisma.task.groupBy({
        by: ["assignedToId"],
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueDate: { lt: new Date() },
          assignedToId: { not: null }
        },
        _count: { id: true }
      });

      for (const ot of overdueTasks) {
        if (ot.assignedToId) {
          const agentUser = await prisma.user.findUnique({
            where: { id: ot.assignedToId },
            select: { name: true }
          });
          managementAlerts.push({
            type: "overdue_tasks",
            text: `Agent ${agentUser?.name || "Unknown"} has ${ot._count.id} PENDING task${ot._count.id > 1 ? "s" : ""} past their due date`,
            agent: agentUser?.name || "Unknown",
            severity: "warning"
          });
        }
      }

      // 3. Pipeline Value by Stage (for BarChart) - Single optimized query & in-memory grouping
      const allActiveQuotations = await prisma.quotation.findMany({
        where: quotationWhereClause,
        include: {
          lead: { select: { status: true } },
          customer: { include: { lead: { select: { status: true } } } }
        }
      });

      const stageValues: Record<string, number> = {
        "New": 0,
        "Contacted": 0,
        "Qualified": 0,
        "Proposal Sent": 0,
        "Negotiation": 0,
        "Won": 0
      };

      allActiveQuotations.forEach(q => {
        const amount = Number(q.totalAmount || 0);
        let leadStatus = q.lead?.status || q.customer?.lead?.status;
        
        if (!leadStatus) {
          if (q.status === "ACCEPTED") {
            leadStatus = "WON";
          } else if (q.status === "SENT") {
            leadStatus = "PROPOSAL_SENT";
          } else {
            leadStatus = "QUALIFIED";
          }
        }

        switch (leadStatus) {
          case "NEW":
            stageValues["New"] += amount;
            break;
          case "CONTACTED":
            stageValues["Contacted"] += amount;
            break;
          case "QUALIFIED":
            stageValues["Qualified"] += amount;
            break;
          case "PROPOSAL_SENT":
            stageValues["Proposal Sent"] += amount;
            break;
          case "NEGOTIATION":
            stageValues["Negotiation"] += amount;
            break;
          case "WON":
            stageValues["Won"] += amount;
            break;
          default:
            if (q.status === "ACCEPTED") {
              stageValues["Won"] += amount;
            } else if (q.status === "SENT") {
              stageValues["Proposal Sent"] += amount;
            } else {
              stageValues["Qualified"] += amount;
            }
            break;
        }
      });

      const pipelineByStage = [
        { name: "New", value: stageValues["New"] },
        { name: "Contacted", value: stageValues["Contacted"] },
        { name: "Qualified", value: stageValues["Qualified"] },
        { name: "Proposal Sent", value: stageValues["Proposal Sent"] },
        { name: "Negotiation", value: stageValues["Negotiation"] },
        { name: "Won", value: stageValues["Won"] }
      ];

      // 4. Source Pipeline (count + value per source)
      const allSources = ["WEBSITE", "REFERRAL", "WHATSAPP", "COLD_CALL", "SOCIAL_MEDIA", "WALK_IN", "MANUAL", "OTHER"] as const;
      const sourcePipeline = await Promise.all(allSources.map(async (source) => {
        const leadsCount = await prisma.lead.count({
          where: {
            source: source as any,
            ...leadWhereClause
          }
        });
        const sourceQuotations = await prisma.quotation.findMany({
          where: {
            ...quotationWhereClause,
            OR: [
              {
                lead: {
                  source: source as any
                }
              },
              {
                customer: {
                  lead: {
                    source: source as any
                  }
                }
              }
            ]
          },
          select: { totalAmount: true }
        });
        const totalValue = sourceQuotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
        return {
          source: formatEnum(source),
          count: leadsCount,
          value: totalValue
        };
      }));
      // Filter out sources with 0 leads, sort by value descending
      const filteredSourcePipeline = sourcePipeline.filter(s => s.count > 0).sort((a, b) => b.value - a.value);

      // 5. Agent Task Completion Matrix
      const agentTaskMatrix = await Promise.all(agents.map(async (agent) => {
        const totalTasks = await prisma.task.count({ where: { assignedToId: agent.id } });
        const completedTasks = await prisma.task.count({
          where: { assignedToId: agent.id, status: "COMPLETED" }
        });
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return { name: agent.name, total: totalTasks, completed: completedTasks, percentage };
      }));

      managerData = {
        agentLeaderboard,
        managementAlerts,
        pipelineByStage,
        sourcePipeline: filteredSourcePipeline,
        agentTaskMatrix
      };
    }

    res.status(200).json({
      success: true,
      data: {
        kpis: { newLeads, hotLeads, converted, pipelineValue },
        stageBreakdown,
        weeklyTrend,
        hotLeadsList,
        leadSources,
        todaysTasks,
        recentActivities,
        ...(managerData ? { managerData } : {})
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
