"use client";

import {
  Bug,
  CloudSun,
  FlaskConical,
  Landmark,
  Sprout,
  TrendingUp,
} from "lucide-react";

const actions = [
  {
    label: "Disease Scanner",
    description: "Upload crop image for AI diagnosis",
    icon: Bug,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    label: "Weather Forecast",
    description: "7-day local weather prediction",
    icon: CloudSun,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    label: "Soil Analysis",
    description: "AI-powered soil health insights",
    icon: FlaskConical,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Govt. Schemes",
    description: "Latest subsidies & programs",
    icon: Landmark,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Crop Planner",
    description: "Seasonal planting calendar",
    icon: Sprout,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
  {
    label: "Market Prices",
    description: "Live mandi rates & trends",
    icon: TrendingUp,
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
];

export function QuickActions() {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="glass-subtle group flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-all hover:glow-green"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-110`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-[11px] text-muted-foreground">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
