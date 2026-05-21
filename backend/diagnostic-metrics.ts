import { getDashboardMetrics } from "./src/controllers/dashboard.controller";
import { AuthRequest } from "./src/types/shared.types";
import { Response } from "express";
import { UserRole } from "@prisma/client";
import prisma from "./src/config/prisma";

// Mock Response class
class MockResponse {
  statusCode: number = 200;
  jsonBody: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(body: any) {
    this.jsonBody = body;
    return this;
  }
}

async function runTest() {
  // 1. Let's find some users in the DB
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, officeId: true }
  });

  const anirudh = users.find(u => u.name === "Anirudh");
  const hamza = users.find(u => u.name === "Hamza");
  
  if (anirudh) {
    console.log("=== RUNNING FOR ANIRUDH (MANAGER) ===");
    const req = {
      user: {
        userId: anirudh.id,
        email: anirudh.email,
        role: anirudh.role as any,
        officeId: anirudh.officeId
      }
    } as unknown as AuthRequest;
    
    const res = new MockResponse() as unknown as Response;
    await getDashboardMetrics(req, res);
    
    const body = (res as any).jsonBody;
    console.log("Status Code:", (res as any).statusCode);
    console.log("KPIs:", body?.data?.kpis);
    console.log("Pipeline by Stage:", body?.data?.managerData?.pipelineByStage);
  }

  if (hamza) {
    console.log("\n=== RUNNING FOR HAMZA (AGENT) ===");
    const req = {
      user: {
        userId: hamza.id,
        email: hamza.email,
        role: hamza.role as any,
        officeId: hamza.officeId
      }
    } as unknown as AuthRequest;
    
    const res = new MockResponse() as unknown as Response;
    await getDashboardMetrics(req, res);
    
    const body = (res as any).jsonBody;
    console.log("Status Code:", (res as any).statusCode);
    console.log("KPIs:", body?.data?.kpis);
    console.log("Stage Breakdown:", body?.data?.stageBreakdown);
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
