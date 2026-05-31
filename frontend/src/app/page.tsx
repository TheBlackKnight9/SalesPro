"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLogo } from "@/components/AppLogo";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CometCard } from "@/components/ui/comet-card";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";

import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Users, 
  ListTodo, 
  FileText, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight 
} from "lucide-react";

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // "use white photo for dark mode and black photo for light mode"
  const isDarkTheme = mounted && resolvedTheme === "dark";

  const heroImg = isDarkTheme 
    ? "/new-media/Screenshot 2026-05-29 165034.png" // White Dashboard
    : "/new-media/Screenshot 2026-05-29 165017.png"; // Black Dashboard

  const intelligenceImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165419.png" // White Analytics ROI
    : "/new-media/Screenshot 2026-05-29 211509.png"; // Black Analytics ROI

  const flowLeadsImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165139.png" // White Leads
    : "/new-media/Screenshot 2026-05-29 165823.png"; // Black Leads

  const flowCustomersImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165156.png" // White Customers
    : "/new-media/Screenshot 2026-05-29 210438.png"; // Black Customers

  const controlImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 211003.png" // White Tasks
    : "/new-media/Screenshot 2026-05-29 165711.png"; // Black Tasks

  const proposalsImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165249.png" // White Quotations
    : "/new-media/Screenshot 2026-05-29 165643.png"; // Black Quotations

  const scalabilityOfficesImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165314.png" // White Offices grid
    : "/new-media/Screenshot 2026-05-29 165629.png"; // Black Offices grid

  const scalabilityTeamImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165330.png" // White Team list
    : "/new-media/Screenshot 2026-05-29 165553.png"; // Black Team list

  const auditsROIImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165419.png" // White ROI Ledger
    : "/new-media/Screenshot 2026-05-29 211509.png"; // Black ROI Ledger

  const auditsMatrixImg = isDarkTheme
    ? "/new-media/Screenshot 2026-05-29 165509.png" // White Agent matrix
    : "/new-media/Screenshot 2026-05-29 165524.png"; // Black Agent matrix

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] selection:bg-[var(--color-text-primary)]/10 overflow-hidden font-sans">
      
      {/* ── NAVIGATION BAR ── */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--color-bg-raised)]/90 backdrop-blur-md border-b border-[var(--color-border)] transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <AppLogo className="h-9 w-9" />
            
            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] uppercase tracking-wider transition-colors">
                Features
              </a>
              <a href="/login" className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] uppercase tracking-wider transition-colors">
                Pricing
              </a>
              <a href="/login" className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] uppercase tracking-wider transition-colors">
                Solutions
              </a>
            </div>

            {/* Right Action */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href="/login" 
                className="rounded-lg bg-[var(--color-accent)] px-6 py-2 text-xs font-bold text-[var(--color-text-inverse)] shadow hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <header className="relative pt-16 pb-10 sm:pt-20 sm:pb-14 bg-gradient-to-b from-[var(--color-bg-base)] to-[var(--color-bg-raised)]">
        {/* Soft elegant glowing backdrops */}
        <div className="absolute top-10 left-1/4 h-96 w-96 rounded-full bg-slate-500/5 blur-[120px] -z-10" />
        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-slate-400/5 blur-[120px] -z-10" />

        <div className="flex flex-col overflow-hidden text-center -mt-28">
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-4xl mx-auto space-y-6 px-6 lg:px-8 mb-8"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-[45px] font-black leading-[1.3] sm:leading-[1.35] tracking-tight text-[var(--color-text-primary)] flex flex-col items-center justify-center gap-y-3">
                  <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <LayoutTextFlip
                      text="Sync Your"
                      words={["Offices", "Workspaces", "Branches", "Teams"]}
                    />
                    <span className="text-neutral-400">.</span>
                  </span>
                  <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <LayoutTextFlip
                      text=""
                      textAfter="Your Agents."
                      words={["Empower", "Accelerate", "Elevate", "Activate"]}
                    />
                  </span>
                </h1>
                
                <p className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
                  A sovereign SaaS command center to deploy branch workflows, monitor real-time quotas, and secure multi-tenant data structures.
                </p>
                
                <div className="mt-8 flex items-center justify-center gap-3.5">
                  <Link
                    href="/login"
                    className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-xs font-bold text-[var(--color-text-inverse)] shadow hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 cursor-pointer"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-strong)] border border-[var(--color-border)] px-6 py-3 text-xs font-bold text-[var(--color-text-primary)] shadow transition-all active:scale-95 cursor-pointer"
                  >
                    Launch Workspace &rarr;
                  </Link>
                </div>
              </motion.div>
            }
          >
            <img 
              src={heroImg} 
              alt="SalesPro CRM Dashboard Analytics" 
              className="mx-auto rounded-2xl object-cover h-full w-full object-left-top select-none border border-[var(--color-border)]"
              draggable={false}
            />
          </ContainerScroll>
        </div>
      </header>

      {/* ── FEATURES CONTAINER ── */}
      <main id="features" className="py-16 space-y-28 bg-[var(--color-bg-base)] transition-colors">
        
        {/* ========================================================================= */}
        {/* SECTION 2: Real-time Operational Intelligence (IMAGE LEFT, TEXT RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Image */}
          <div className="lg:col-span-7 transform lg:scale-105">
            <CometCard className="w-full h-full">
              <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
                <img 
                  src={intelligenceImg} 
                  alt="Real-time Operational Intelligence" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </CometCard>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Real-time Operational Intelligence
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Monitor performance tracking, revenue target achievements, active office lists, and lead flow volume parameters across the organization with live, high-density charts and leaderboard profiles.
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-text-primary)] shrink-0" />
                <span>Regional Office Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-text-primary)] shrink-0" />
                <span>Multi-Tenant Performance Metrics Security</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: Elite Lead & Customer Flow (TEXT LEFT, IMAGE RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pr-6 order-2 lg:order-1">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Elite Lead & Customer Flow
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Pipeline prospects and convert clients seamlessly inside a high-fidelity data workspace while preserving absolute dynamic multi-tenant user scoping boundaries.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg shadow-sm">
                200+ leads processed daily
              </span>
              <span className="text-[11px] font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg shadow-sm">
                70+ converted customers
              </span>
            </div>
          </div>
          {/* Right Column: Overlapping stacked images */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[420px] w-full max-w-xl mx-auto order-1 lg:order-2 transform lg:scale-105">
            <div className="absolute top-0 left-0 w-[78%] z-0">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-md bg-[var(--color-bg-raised)]">
                  <img 
                    src={flowLeadsImg} 
                    alt="Lead Pipeline" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-xl bg-[var(--color-bg-raised)]">
                  <img 
                    src={flowCustomersImg} 
                    alt="Client Workspace" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: Precision Mission Control (IMAGE LEFT, TEXT RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Image */}
          <div className="lg:col-span-7 transform lg:scale-105">
            <CometCard className="w-full h-full">
              <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
                <img 
                  src={controlImg} 
                  alt="Precision Mission Control" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </CometCard>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <ListTodo className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Precision Mission Control
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Coordinate, assign, and execute personal agent lists with high-density task logs, priority status values, automated reminders, and calendar lookback views.
            </p>
            <div className="pt-2">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-text-primary)] hover:underline"
              >
                Explore Task Workflows
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: High-Speed Proposals (TEXT LEFT, IMAGE RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pr-6 order-2 lg:order-1">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              High-Speed Proposals
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Generate instantly-downloadable, professional PDF invoices and price quotations for leads and converted customers, linking items and GST figures.
            </p>
            
            {/* Highlight Alert Box */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-[var(--color-bg-raised)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] font-medium">
                <strong>Secure document storage.</strong> All generated quotations are stored securely and generated programmatically in the system's encrypted storage spaces.
              </p>
            </div>
          </div>
          {/* Right Column: Image */}
          <div className="lg:col-span-7 order-1 lg:order-2 transform lg:scale-105">
            <CometCard className="w-full h-full">
              <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-raised)]">
                <img 
                  src={proposalsImg} 
                  alt="High-Speed Proposals" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </CometCard>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: Multi-Office Scalability (IMAGE LEFT, TEXT RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Stacked images */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[420px] w-full max-w-xl mx-auto transform lg:scale-105">
            <div className="absolute top-0 left-0 w-[78%] z-0">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-md bg-[var(--color-bg-raised)]">
                  <img 
                    src={scalabilityOfficesImg} 
                    alt="Offices Hub" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-xl bg-[var(--color-bg-raised)]">
                  <img 
                    src={scalabilityTeamImg} 
                    alt="Office Settings" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Multi-Office Scalability
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Organize global revenue, branch targets, and teams. Filter metrics dynamically by branch office selections directly inside the central control board.
            </p>
            
            {/* Horizontal Grid Info */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] p-3 rounded-xl">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">FILTERS</p>
                <p className="text-xs font-bold text-[var(--color-text-primary)] mt-0.5">Group metrics by offices</p>
              </div>
              <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] p-3 rounded-xl">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">TARGETS</p>
                <p className="text-xs font-bold text-[var(--color-text-primary)] mt-0.5">Define custom targets per branch</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: Deep Performance Audits (TEXT LEFT, IMAGE RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pr-6 order-2 lg:order-1">
            <div className="h-9 w-9 bg-[var(--color-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Deep Performance Audits
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
              Track user activity histories, audit logging metrics, and status updates across the sales pipeline. Verify system security with comprehensive audit trails.
            </p>
            <div className="space-y-2 pt-2">
              <Link 
                href="/login" 
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-overlay)] text-xs font-bold text-[var(--color-text-primary)] transition-colors"
              >
                <span>Audit Logs for All Modules</span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-primary)]" />
              </Link>
              <Link 
                href="/login" 
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-overlay)] text-xs font-bold text-[var(--color-text-primary)] transition-colors"
              >
                <span>Team Activity Tracking</span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-primary)]" />
              </Link>
            </div>
          </div>
          {/* Right Column: Stacked images */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[420px] w-full max-w-xl mx-auto order-1 lg:order-2 transform lg:scale-105">
            <div className="absolute top-0 left-0 w-[78%] z-0">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-md bg-[var(--color-bg-raised)]">
                  <img 
                    src={auditsROIImg} 
                    alt="Audit Workspace" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-xl bg-[var(--color-bg-raised)]">
                  <img 
                    src={auditsMatrixImg} 
                    alt="Activity Logs" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
          </div>

        </section>

      </main>

      {/* ── FOOTER SECTION ── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-raised)] pt-16 pb-8 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid gap-8 grid-cols-2 md:grid-cols-5 mb-12">
          
          {/* Logo column */}
          <div className="col-span-2 space-y-4">
            <AppLogo className="h-8 w-8" />
            <p className="text-xs text-[var(--color-text-secondary)] font-medium max-w-xs leading-relaxed">
              Live enterprise performance tracking workspace. Built with secure multitenancy boundaries for isolated branch office architectures.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Product</p>
            <ul className="space-y-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <li><a href="#features" className="hover:text-[var(--color-text-primary)]">Overview</a></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Features</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Workspace</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Status</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Company</p>
            <ul className="space-y-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Privacy Policy</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Terms of Service</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Contact Us</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Careers</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Support</p>
            <ul className="space-y-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Help Center</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Guides</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-text-primary)]">Documentation</Link></li>
            </ul>
          </div>

        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--color-text-muted)]">
          <p>© {new Date().getFullYear()} SalesPro CRM. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[var(--color-text-primary)]">Twitter</a>
            <a href="#" className="hover:text-[var(--color-text-primary)]">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
