import { Navbar } from "@/components/navbar";
import { StatsCards } from "@/components/stats-cards";
import { WeatherWidget } from "@/components/weather-widget";
import { NewsWidget } from "@/components/news-widget";
import { QuickActions } from "@/components/quick-actions";
import { VoiceAIChat } from "@/components/voice-ai-chat";

export default function Page() {
  return (
    <div className="relative min-h-screen">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-chart-3/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Welcome section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl">
              Welcome back, Farmer
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {"Here's"} your daily farming intelligence powered by AI
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsCards />
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-6 lg:col-span-3">
              <WeatherWidget />
              <QuickActions />
            </div>
            <div className="lg:col-span-2">
              <NewsWidget />
            </div>
          </div>
        </main>
      </div>

      {/* Floating AI Chat */}
      <VoiceAIChat />
    </div>
  );
}
