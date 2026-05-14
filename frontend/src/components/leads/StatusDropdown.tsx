"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { apiClient } from "@/lib/api";

export const STATUS_OPTIONS = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-purple-100 text-purple-800" },
  { value: "WON", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-800" },
];

interface StatusDropdownProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  size?: "sm" | "md";
}

export default function StatusDropdown({ leadId, currentStatus, onStatusChange, size = "sm" }: StatusDropdownProps) {
  const statusConfig = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    try {
      if (newStatus === "WON") {
        if (!window.confirm("Convert this lead to a customer? This will move it to the Customers list.")) return;
        await apiClient.post(`/leads/${leadId}/convert`);
      } else {
        await apiClient.patch(`/leads/${leadId}/status`, { status: newStatus });
      }
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className={`inline-flex items-center gap-1.5 font-bold rounded-full transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 ${statusConfig.color} ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`}>
        {statusConfig.label}
        <ChevronDown className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 mt-2 w-48 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none p-1.5 border border-gray-100">
          {STATUS_OPTIONS.map((option) => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  onClick={() => handleStatusUpdate(option.value)}
                  className={`${
                    active ? "bg-gray-50 text-gray-900" : "text-gray-700"
                  } group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium`}
                >
                  <span className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </span>
                  {currentStatus === option.value && <Check className="h-4 w-4 text-brand-blue" />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
