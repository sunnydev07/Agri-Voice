"use client";

import { Leaf, TrendingUp, Droplets, Zap } from "lucide-react";

const stats = [
  {
    label: "Crop Health Index",
    value: "87%",
    change: "+2.4%",
    icon: Leaf,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Growth Rate",
    value: "12.5cm",
    change: "+0.8cm",
    icon: TrendingUp,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Soil Moisture",
    value: "64%",
    change: "-1.2%",
    icon: Droplets,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    label: "AI Insights",
    value: "24",
    change: "Today",
    icon: Zap,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-2xl p-4 transition-all hover:glow-green"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              {stat.change}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
