"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  isHot?: boolean;
  delayMs?: number;
}

export function MetricCard({ title, value, icon: Icon, isHot = false, delayMs = 0 }: MetricCardProps) {
  return (
    <Card
      className={[
        "panel-surface fade-up rounded-2xl border-white/70 bg-white/78 transition-[transform,box-shadow,border-color] duration-500 ease-out",
        isHot ? "border-emerald-300/80 shadow-[0_20px_45px_-28px_rgba(16,185,129,0.45)]" : "",
      ].join(" ")}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardDescription className="max-w-[10ch] text-[0.78rem] font-medium leading-4 tracking-[-0.01em] text-slate-600">
          {title}
        </CardDescription>
        <div
          className={[
            "flex size-8 items-center justify-center rounded-xl border shadow-sm transition-all duration-500 ease-out",
            isHot
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-primary/10 bg-primary/5 text-primary/80",
          ].join(" ")}
        >
          {isHot ? <ArrowUpRight className="size-4 animate-[gain-arrow_1.1s_ease-out_both]" /> : <Icon className="size-4" />}
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <p
          className={[
            "font-sans font-semibold leading-none tracking-[-0.04em] transition-all duration-500 ease-out md:text-2xl",
            isHot ? "text-emerald-700 drop-shadow-[0_0_10px_rgba(16,185,129,0.18)]" : "text-slate-900",
          ].join(" ")}
        >
          {value} 
        </p>
      </CardContent>
    </Card>
  );
}
