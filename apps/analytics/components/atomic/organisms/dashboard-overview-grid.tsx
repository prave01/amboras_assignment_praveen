"use client";

import { Activity, CircleDollarSign, MousePointerClick, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/atomic/molecules/metric-card";
import type { DashboardMetricCard } from "@/lib/analytics/dashboard";

interface DashboardOverviewGridProps {
  cards: DashboardMetricCard[];
  gainFlash: Record<string, boolean>;
  isLoading: boolean;
}

export function DashboardOverviewGrid({ cards, gainFlash, isLoading }: DashboardOverviewGridProps) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {isLoading
        ? Array.from({ length: 6 }).map((_, index) => (
            <Card key={`overview-skeleton-${index}`} className="panel-surface rounded-2xl border-white/70 bg-white/75">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/5 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-4/5 rounded-lg" />
              </CardContent>
            </Card>
          ))
        : cards.map((card, index) => (
            <MetricCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              isHot={Boolean(gainFlash[card.key])}
              delayMs={index * 45}
            />
          ))}
    </section>
  );
}
