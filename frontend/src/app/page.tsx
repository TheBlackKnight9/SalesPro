"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CometCard } from "@/components/ui/comet-card";

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
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-500/20 overflow-hidden font-sans">
      
      {/* ── NAVIGATION BAR ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-[17px] font-black tracking-tight text-slate-900 dark:text-white">
                SalesPro <span className="text-indigo-600 dark:text-indigo-400">CRM</span>
              </span>
            </div>
            
            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider transition-colors">
                Pricing
              </a>
              <a href="#solutions" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider transition-colors">
                Solutions
              </a>
            </div>

            {/* Right Action */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href="/login" 
                className="rounded-full bg-indigo-600 px-6 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-750 hover:shadow transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950 dark:to-slate-950">
        {/* Soft elegant glowing backdrops */}
        <div className="absolute top-10 left-1/4 h-96 w-96 rounded-full bg-indigo-450/5 blur-[120px] -z-10" />
        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-cyan-400/5 blur-[120px] -z-10" />

        <div className="flex flex-col overflow-hidden text-center -mt-16">
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-4xl mx-auto space-y-6 px-6 lg:px-8 mb-8"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
                  From Prospect to Profit.
                </p>
                
                <h1 className="text-4xl sm:text-5xl lg:text-[45px] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
                  Sync Your Entire Sales <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Engine</span> in One Place.
                </h1>
                
                <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                  Trust a dynamic interface to track, manage, and close deals without missing a single beat.
                </p>
                
                <div className="mt-8 flex items-center justify-center gap-3.5">
                  <Link
                    href="/login"
                    className="rounded-lg bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-750 transition-all active:scale-95"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-slate-200 dark:border-indigo-900/50 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                  >
                    Launch Workspace &rarr;
                  </Link>
                </div>
              </motion.div>
            }
          >
            <img 
              src="/media/Screenshot%202026-05-26%20115831.png" 
              alt="SalesPro CRM Dashboard Analytics" 
              className="mx-auto rounded-2xl object-cover h-full w-full object-left-top select-none border border-slate-200/60 dark:border-slate-800"
              draggable={false}
            />
          </ContainerScroll>
        </div>
      </header>

      {/* ── FEATURES CONTAINER ── */}
      <main id="features" className="py-16 space-y-28 bg-white dark:bg-slate-950 transition-colors">
        
        {/* ========================================================================= */}
        {/* SECTION 2: Real-time Operational Intelligence (IMAGE LEFT, TEXT RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Image */}
          <div className="lg:col-span-7 transform lg:scale-105">
            <CometCard className="w-full h-full">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                <img 
                  src="/media/Screenshot%202026-05-26%20115841.png" 
                  alt="Real-time Operational Intelligence" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </CometCard>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-time Operational Intelligence
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Monitor performance tracking, revenue target achievements, active office lists, and lead flow volume parameters across the organization with live, high-density charts and leaderboard profiles.
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Regional Office Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
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
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Elite Lead & Customer Flow
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Pipeline prospects and convert clients seamlessly inside a high-fidelity data workspace while preserving absolute dynamic multi-tenant user scoping boundaries.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                200+ leads processed daily
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                70+ converted customers
              </span>
            </div>
          </div>
          {/* Right Column: Overlapping stacked images */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[420px] w-full max-w-xl mx-auto order-1 lg:order-2 transform lg:scale-105">
            <div className="absolute top-0 left-0 w-[78%]">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115850.png" 
                    alt="Lead Pipeline" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115901.png" 
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
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                <img 
                  src="/media/Screenshot%202026-05-26%20115906.png" 
                  alt="Precision Mission Control" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </CometCard>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ListTodo className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Precision Mission Control
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Coordinate, assign, and execute personal agent lists with high-density task logs, priority status values, automated reminders, and calendar lookback views.
            </p>
            <div className="pt-2">
              <a 
                href="/login" 
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Explore Task Workflows
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: High-Speed Proposals (TEXT LEFT, IMAGE RIGHT) */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-12 md:px-24 lg:px-32 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pr-6 order-2 lg:order-1">
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              High-Speed Proposals
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Generate instantly-downloadable, professional PDF invoices and price quotations for leads and converted customers, linking items and GST figures.
            </p>
            
            {/* Highlight Alert Box */}
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-450 font-medium">
                <strong>Secure document storage.</strong> All generated quotations are stored securely and generated programmatically in the system's encrypted storage spaces.
              </p>
            </div>
          </div>
          {/* Right Column: Image */}
          <div className="lg:col-span-7 order-1 lg:order-2 transform lg:scale-105">
            <CometCard className="w-full h-full">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                <img 
                  src="/media/Screenshot%202026-05-26%20115914.png" 
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
            <div className="absolute top-0 left-0 w-[78%]">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115922.png" 
                    alt="Offices Hub" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115939.png" 
                    alt="Office Settings" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
          </div>

          {/* Right Column: Text content */}
          <div className="lg:col-span-5 space-y-4 max-w-lg lg:pl-6">
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Multi-Office Scalability
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Organize global revenue, branch targets, and teams. Filter metrics dynamically by branch office selections directly inside the central control board.
            </p>
            
            {/* Horizontal Grid Info */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">FILTERS</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Group metrics by offices</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">TARGETS</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Define custom targets per branch</p>
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
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Deep Performance Audits
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Track user activity histories, audit logging metrics, and status updates across the sales pipeline. Verify system security with comprehensive audit trails.
            </p>
            <div className="space-y-2 pt-2">
              <a 
                href="/login" 
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Audit Logs for All Modules</span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
              </a>
              <a 
                href="/login" 
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Team Activity Tracking</span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
              </a>
            </div>
          </div>
          {/* Right Column: Stacked images */}
          <div className="lg:col-span-7 relative h-[300px] sm:h-[420px] w-full max-w-xl mx-auto order-1 lg:order-2 transform lg:scale-105">
            <div className="absolute top-0 left-0 w-[78%]">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115939.png" 
                    alt="Audit Workspace" 
                    className="w-full h-auto object-cover select-none"
                  />
                </div>
              </CometCard>
            </div>
            <div className="absolute bottom-0 right-0 w-[75%] z-10">
              <CometCard className="w-full h-full">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white">
                  <img 
                    src="/media/Screenshot%202026-05-26%20115945.png" 
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
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 pt-16 pb-8 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid gap-8 grid-cols-2 md:grid-cols-5 mb-12">
          
          {/* Logo column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">
                SalesPro <span className="text-indigo-600">CRM</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs leading-relaxed">
              Live enterprise performance tracking workspace. Built with secure multitenancy boundaries for isolated branch office architectures.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Product</p>
            <ul className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><a href="#features" className="hover:text-indigo-600">Overview</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Features</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Workspace</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Status</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Company</p>
            <ul className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><a href="/login" className="hover:text-indigo-600">Privacy Policy</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Terms of Service</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Contact Us</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Careers</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Support</p>
            <ul className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li><a href="/login" className="hover:text-indigo-600">Help Center</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Guides</a></li>
              <li><a href="/login" className="hover:text-indigo-600">Documentation</a></li>
            </ul>
          </div>

        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-450 dark:text-slate-550">
          <p>© {new Date().getFullYear()} SalesPro CRM. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-700">Twitter</a>
            <a href="#" className="hover:text-slate-700">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
