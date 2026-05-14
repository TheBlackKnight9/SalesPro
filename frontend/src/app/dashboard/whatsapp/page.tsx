"use client";

import { useState, useEffect } from "react";
import { Search, MessageCircle, Send } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Message {
  id: string;
  fromPhone: string;
  toPhone: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  createdAt: string;
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Message[]>("/whatsapp");
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Messages</h1>
          <p className="mt-1 text-sm text-gray-500">Communicate with your leads and customers.</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Chat List (Simple for now) */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-4 bg-gray-50 cursor-pointer">
              <p className="font-medium text-gray-900">Recent Activity</p>
              <p className="text-xs text-gray-500 truncate">Select a message to view details</p>
            </div>
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <p className="text-center text-gray-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                <p>No messages found.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md p-3 rounded-lg shadow-sm ${
                    msg.direction === "OUTBOUND" ? "bg-accent text-white" : "bg-white text-gray-900 border border-gray-200"
                  }`}>
                    <p className="text-xs opacity-70 mb-1">{msg.fromPhone} → {msg.toPhone}</p>
                    <p>{msg.body}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
              />
              <button className="btn btn-primary p-2">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
