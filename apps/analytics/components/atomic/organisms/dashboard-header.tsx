"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  storeName?: string;
  ownerName?: string;
  isIdentityLoading?: boolean;
}

export function DashboardHeader({
  onRefresh,
  onLogout,
  isLoggingOut,
  storeName,
  ownerName,
  isIdentityLoading,
}: DashboardHeaderProps) {
  return (
    <header className="fade-up panel-surface rounded-3xl px-6 py-5 md:px-8 md:py-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.34em] text-muted-foreground">AMBORAS BOARD</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {isIdentityLoading ? (
              <>
                <Skeleton className="h-7 w-36 rounded-full" />
                <Skeleton className="h-7 w-32 rounded-full" />
              </>
            ) : (
              <>
                <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/5 px-3 py-1 text-primary">
                  Store: {storeName ?? "Unknown store"}
                </Badge>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                  Owner: {ownerName ?? "Unknown owner"}
                </Badge>
              </>
            )}
          </div>
          <h1 className="mt-3 font-heading text-3xl leading-tight text-foreground md:text-5xl">
            Commercial telemetry at a glance
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Unified trendlines for revenue, funnel quality, and product momentum. Values refresh from live event ingestion.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/5 px-3 py-1 text-primary">
              Live updates enabled
            </Badge>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
              Refreshing every 10-45s depending on panel
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-primary/25 bg-white/65 transition-transform duration-150 ease-out hover:bg-white active:scale-[0.98]"
            onClick={onRefresh}
          >
            Refresh data
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-rose-200 bg-rose-50 text-rose-700 transition-transform duration-150 ease-out hover:bg-rose-100 active:scale-[0.98]"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 size-4" />
            {isLoggingOut ? "Signing out" : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
