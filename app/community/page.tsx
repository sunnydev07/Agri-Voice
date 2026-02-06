"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Wallet,
  HandCoins,
  ImageIcon,
  Phone,
  ArrowLeft,
  Users,
} from "lucide-react";
import type { User } from "@/lib/community-store";
import { ChatTab } from "@/components/community/chat-tab";
import { PaymentsTab } from "@/components/community/payments-tab";
import { BondsTab } from "@/components/community/bonds-tab";
import { GalleryTab } from "@/components/community/gallery-tab";
import { VoiceCallTab } from "@/components/community/voice-call-tab";

type Tab = "chat" | "payments" | "bonds" | "gallery" | "calls";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "payments", label: "Pay", icon: Wallet },
  { id: "bonds", label: "Bonds", icon: HandCoins },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "calls", label: "Calls", icon: Phone },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/community/users");
      const data = await res.json();
      setUsers(data.users || []);
      if (!currentUser && data.users?.length > 0) {
        setCurrentUser(data.users[0]);
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-50 px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">Community Hub</h1>
                  <p className="text-[10px] text-muted-foreground">
                    {users.length} farmers online
                  </p>
                </div>
              </div>
            </div>

            {/* User selector */}
            <div className="flex items-center gap-2">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const u = users.find((usr) => usr.id === e.target.value);
                  if (u) setCurrentUser(u);
                }}
                className="rounded-lg bg-muted/50 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Select user"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {currentUser.avatar}
              </span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="glass-subtle sticky top-[60px] z-40 border-b border-border/30">
          <div className="mx-auto flex max-w-4xl items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl">
          <div className="glass m-4 overflow-hidden rounded-2xl">
            {activeTab === "chat" && (
              <ChatTab currentUser={currentUser} users={users} />
            )}
            {activeTab === "payments" && (
              <PaymentsTab
                currentUser={currentUser}
                users={users}
                onRefreshUsers={fetchUsers}
              />
            )}
            {activeTab === "bonds" && (
              <BondsTab currentUser={currentUser} onRefreshUsers={fetchUsers} />
            )}
            {activeTab === "gallery" && (
              <GalleryTab currentUser={currentUser} />
            )}
            {activeTab === "calls" && (
              <VoiceCallTab currentUser={currentUser} users={users} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
