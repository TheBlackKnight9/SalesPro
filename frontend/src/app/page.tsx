"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, MessageCircle, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      name: "Smart Lead Pipeline",
      description: "Convert prospects faster with an intelligent Kanban board and automated task assignments.",
      icon: BarChart3,
    },
    {
      name: "Native WhatsApp Integration",
      description: "Send templates and receive replies directly within the CRM using the official Meta API.",
      icon: MessageCircle,
    },
    {
      name: "Instant PDF Quotations",
      description: "Generate professional, branded invoices and price quotes on the fly with a single click.",
      icon: Zap,
    },
    {
      name: "Enterprise Security",
      description: "Role-based access control ensures agents only see their data, while managers oversee the whole team.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden selection:bg-accent/30">
      {/* ── Navigation Bar ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-[#111928]">
                SalesPro<span className="text-accent">CRM</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/login" 
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover transition-all hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#1A56DB] to-[#0E9F6E] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                Announcing our next generation CRM platform.{' '}
                <Link href="/login" className="font-semibold text-accent">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Read more <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Close deals faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-success">intelligent sales</span> tools.
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600">
              SalesPro CRM unifies your leads, WhatsApp conversations, and PDF quotations into one powerful, easy-to-use platform. Built for modern sales teams who need speed and visibility.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="group rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="inline-block ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 hover:text-accent transition-colors">
                Learn more <span aria-hidden="true">↓</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview Image (Mock) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-16 sm:mt-24 lg:mt-32 max-w-7xl mx-auto px-6 lg:px-8"
        >
          <div className="rounded-2xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-3xl lg:p-4">
            <div className="rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10 flex items-center justify-center h-[400px] sm:h-[600px] overflow-hidden relative">
              {/* This is a placeholder for an actual dashboard screenshot */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border border-gray-200 rounded-xl">
                 <BarChart3 className="h-24 w-24 text-accent/20 mb-6" />
                 <h3 className="text-2xl font-bold text-gray-800">Your Sales Command Center</h3>
                 <p className="text-gray-500 mt-2">Log in to view the live dashboard.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Features Section ── */}
      <div id="features" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-accent">Deploy faster</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to scale your sales team
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Forget juggling spreadsheets, manual WhatsApp messages, and external invoice generators. We have combined all your core sales workflows into a single pane of glass.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.name} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-primary text-gray-400 py-12 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} SalesPro CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
