"use client";

import Link from "next/link";
import {
  Bug,
  CloudSun,
  FlaskConical,
  Mic,
  TrendingUp,
  Users,
  Landmark,
} from "lucide-react";

const actions = [
  {
    label: "Disease Scanner",
    description: "Upload crop image for AI diagnosis",
    icon: Bug,
    color: "text-destructive",
    bg: "bg-destructive/10",
    href: "/disease-scanner",
  },
  {
    label: "Voice Assistant",
    description: "Ask farming questions by voice",
    icon: Mic,
    color: "text-primary",
    bg: "bg-primary/10",
    href: "/voice-assistant",
  },
  {
    label: "Market Prices",
    description: "Live mandi rates & trends",
    icon: TrendingUp,
    color: "text-chart-5",
    bg: "bg-chart-5/10",
    href: "/market-prices",
  },
  {
    label: "Weather Forecast",
    description: "7-day local weather prediction",
    icon: CloudSun,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    href: null,
  },
  {
    label: "Soil Analysis",
    description: "AI-powered soil health insights",
    icon: FlaskConical,
    color: "text-accent",
    bg: "bg-accent/10",
    href: null,
  },
  {
    label: "Community Hub",
    description: "Chat, pay & call farmers",
    icon: Users,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    href: "/community",
  },
];

export function QuickActions() {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {actions.map((action) => {
          const content = (
            <>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-110`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">{action.description}</p>
              </div>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.label}
                href={action.href}
                className="glass-subtle group flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-all hover:glow-green"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              type="button"
              className="glass-subtle group flex flex-col items-start gap-2 rounded-xl p-4 text-left opacity-60 transition-all"
            >
              {content}
              <span className="text-[9px] text-muted-foreground">Coming soon</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
