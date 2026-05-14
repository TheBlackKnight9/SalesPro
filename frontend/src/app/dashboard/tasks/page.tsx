"use client";

import { CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">Track and manage follow-up tasks across your pipeline.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <CheckSquare className="mx-auto h-12 w-12 text-brand-blue/40" />
        <p className="mt-4 text-gray-700">Task module scaffold is ready.</p>
        <p className="mt-1 text-sm text-gray-500">You can now wire task list, assignees, due dates, and status actions here.</p>
      </div>
    </div>
  );
}
