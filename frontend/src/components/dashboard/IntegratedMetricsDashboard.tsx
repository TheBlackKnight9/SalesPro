"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface DashboardProps {
  apiData: {
    kpis: { newLeads: number; hotLeads: number; converted: number; pipelineValue: number };
    stageBreakdown: { 
      New: number; 
      Interested: number; 
      Qualified: number; 
      QuoteSent: number; 
      Negotiation: number; 
      Converted: number; 
    };
    funnelChartData: Array<{ name: string; New: number; Interested: number; QuoteSent: number; Converted: number }>;
  };
}

export default function IntegratedMetricsDashboard({ apiData }: DashboardProps) {
  // Destructure safe data points directly with absolute default zero handling
  const { kpis, stageBreakdown, funnelChartData } = apiData || {};

  // Compute absolute dynamic total leads to render accurate percentage metrics widths
  const maxTotalPipeline = useMemo(() => {
    if (!stageBreakdown) return 1;
    return (
      (stageBreakdown.New || 0) +
      (stageBreakdown.Interested || 0) +
      (stageBreakdown.Qualified || 0) +
      (stageBreakdown.QuoteSent || 0) +
      (stageBreakdown.Negotiation || 0) +
      (stageBreakdown.Converted || 0)
    ) || 1;
  }, [stageBreakdown]);

  // Unified Light Theme Configuration Layout Specs
  const textXs = "text-[13px] leading-[18px]";
  const textSm = "text-[15px] leading-[22px]";
  const borderSlate = "border border-slate-200/80";

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-slate-950 text-slate-800 dark:text-slate-200 space-y-6 font-sans">
      
      {/* 1. Global KPI Metrics Blocks (10% Bigger Geometry Setup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "NEW LEADS", val: kpis?.newLeads || 0 },
          { label: "HOT LEADS", val: kpis?.hotLeads || 0 },
          { label: "CONVERTED", val: kpis?.converted || 0 },
          { label: "PIPELINE VALUE", val: `₹${((kpis?.pipelineValue || 0) / 100000).toFixed(1)}L` }
        ].map((kpi, i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 p-5 rounded-2xl ${borderSlate} dark:border-slate-850 shadow-[0_1px_3px_0_rgba(60,64,67,0.05)]`}>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{kpi.label}</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* 2. Main High-Density Analytics Panels Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPONENT: 10% Upscaled Stage Breakdown Box */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl ${borderSlate} dark:border-slate-850 lg:col-span-4 flex flex-col justify-between shadow-[0_1px_3px_0_rgba(60,64,67,0.05)]`}>
          <div>
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">STAGE BREAKDOWN</h3>
            <div className="space-y-4">
              {[
                { label: "New", count: stageBreakdown?.New || 0, color: "#3b82f6" },
                { label: "Interested", count: stageBreakdown?.Interested || 0, color: "#6366f1" },
                { label: "Qualified", count: stageBreakdown?.Qualified || 0, color: "#a855f7" },
                { label: "Quote Sent", count: stageBreakdown?.QuoteSent || 0, color: "#f59e0b" },
                { label: "Negotiation", count: stageBreakdown?.Negotiation || 0, color: "#ea580c" },
                { label: "Converted", count: stageBreakdown?.Converted || 0, color: "#10b981" }
              ].map((row, index) => {
                const widthPercent = ((row.count / maxTotalPipeline) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center justify-between gap-4 py-0.5">
                    <span className={`w-24 ${textXs} font-medium text-slate-600 dark:text-slate-400`}>{row.label}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${widthPercent}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <span className={`w-8 text-right ${textSm} font-bold text-slate-900 dark:text-white`}>{row.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Accurate Stacked Area Chart Container */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl ${borderSlate} dark:border-slate-850 lg:col-span-8 shadow-[0_1px_3px_0_rgba(60,64,67,0.05)]`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">WEEKLY FUNNEL VOLUME TRACKING</h3>
            <div className="flex gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />New</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />Interested</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />Quote Sent</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />Converted</span>
            </div>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/></linearGradient>
                  <linearGradient id="colorInter" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/></linearGradient>
                  <linearGradient id="colorQuote" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/></linearGradient>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.08}/><stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                
                {/* Premium High-Contrast Custom Tooltip */}
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-xl space-y-1.5 min-w-[120px]">
                          <p className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center gap-4 text-xs font-medium">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                                {entry.name}:
                              </span>
                              <span className="font-bold text-white">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                
                {/* Clean Layered Area Components (Strict StackId Grouping) */}
                <Area type="monotone" dataKey="New" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorNew)" fillOpacity={1} />
                <Area type="monotone" dataKey="Interested" stackId="1" stroke="#6366f1" strokeWidth={2} fill="url(#colorInter)" fillOpacity={1} />
                <Area type="monotone" dataKey="QuoteSent" stackId="1" stroke="#f59e0b" strokeWidth={2} fill="url(#colorQuote)" fillOpacity={1} />
                <Area type="monotone" dataKey="Converted" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#colorConv)" fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
