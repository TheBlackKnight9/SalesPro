"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Leads
        const totalLeads = await prisma_1.default.lead.count();
        // 2. Active Customers
        const activeCustomers = await prisma_1.default.customer.count({
            where: { isActive: true },
        });
        // 3. Pipeline Value (Sum of all Quotations that are pending or accepted)
        // We'll calculate a simple sum for the example
        const quotations = await prisma_1.default.quotation.findMany({
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
    }
    catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map