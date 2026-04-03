"use client";

import useSWR from "swr";
import { Activity, AlertTriangle, CircleDollarSign, MousePointerClick, ShoppingBag, TrendingUp } from "lucide-react";
import { apiPost, type ApiEnvelope } from "@/lib/api";
import { formatCurrency, formatInteger, formatPercent, formatRelativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type PeriodMetrics = {
  totalRevenue: number | string;
  purchaseCount: number;
  pageViewCount: number;
  totalEvents: number;
  conversionRate: number | string;
};

type OverviewResponse = {
  today: PeriodMetrics;
  week: PeriodMetrics;
  month: PeriodMetrics;
};

type TopProduct = {
  rank?: number;
  productId: string | null;
  productName?: string;
  revenue?: number | string;
  totalRevenue?: number | string;
  purchaseCount?: number;
};

type RecentEvent = {
  eventId?: string;
  storeId?: string;
  eventType: string;
  timestamp: string;
  productId?: string | null;
  amount?: number | string | null;
  currency?: string | null;
};

const metricFetcher = () => apiPost<ApiEnvelope<unknown>>("/analytics/overview");
const topProductsFetcher = () => apiPost<ApiEnvelope<TopProduct[]>>("/analytics/top-products");
const activityFetcher = () => apiPost<ApiEnvelope<RecentEvent[]>>("/analytics/recent-activity");

function defaultPeriod(): PeriodMetrics {
  return {
    totalRevenue: 0,
    purchaseCount: 0,
    pageViewCount: 0,
    totalEvents: 0,
    conversionRate: 0,
  };
}

function normalizeOverview(payload: ApiEnvelope<unknown> | undefined): OverviewResponse {
  const raw = payload?.data;

  if (
    typeof raw === "object" &&
    raw !== null &&
    "today" in raw &&
    "week" in raw &&
    "month" in raw
  ) {
    return raw as OverviewResponse;
  }

  const base = {
    today: defaultPeriod(),
    week: defaultPeriod(),
    month: defaultPeriod(),
  };

  if (typeof raw === "object" && raw !== null && "period" in raw) {
    const period = String((raw as { period?: unknown }).period ?? "");
    if (period === "today" || period === "week" || period === "month") {
      base[period] = {
        ...defaultPeriod(),
        ...(raw as Partial<PeriodMetrics>),
      };
    }
  }

  return base;
}

function normalizeTopProducts(payload: ApiEnvelope<TopProduct[]> | undefined): TopProduct[] {
  const records = Array.isArray(payload?.data) ? payload.data : [];
  return records.slice(0, 10).map((product, index) => ({
    ...product,
    rank: product.rank ?? index + 1,
    productName: product.productName ?? product.productId ?? "Unknown product",
    totalRevenue: product.totalRevenue ?? product.revenue ?? 0,
    purchaseCount: product.purchaseCount ?? 0,
  }));
}

function normalizeRecentActivity(payload: ApiEnvelope<RecentEvent[]> | undefined): RecentEvent[] {
  if (!Array.isArray(payload?.data)) {
    return [];
  }
  return payload.data.slice(0, 20);
}

function eventColorClass(eventType: string): string {
  switch (eventType) {
    case "purchase":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "add_to_cart":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "remove_from_cart":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "checkout_started":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export function DashboardClient() {
  const {
    data: overviewData,
    error: overviewError,
    isLoading: isOverviewLoading,
    mutate: refreshOverview,
  } = useSWR("analytics-overview", metricFetcher);

  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
    mutate: refreshProducts,
  } = useSWR("analytics-top-products", topProductsFetcher);

  const {
    data: activityData,
    error: activityError,
    isLoading: isActivityLoading,
    mutate: refreshActivity,
  } = useSWR("analytics-recent-activity", activityFetcher);

  const overview = normalizeOverview(overviewData);
  const products = normalizeTopProducts(productsData);
  const activity = normalizeRecentActivity(activityData);

  const hasError = Boolean(overviewError || productsError || activityError);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <header className="fade-up panel-surface rounded-3xl px-6 py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.34em] text-muted-foreground">AMBORAS BOARD</p>
            <h1 className="mt-3 font-heading text-3xl leading-tight text-foreground md:text-5xl">
              Commercial telemetry at a glance
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Unified trendlines for revenue, funnel quality, and product momentum. Values refresh from live event ingestion.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 w-full rounded-xl border-primary/25 bg-white/65 transition-transform duration-150 ease-out hover:bg-white md:w-auto active:scale-[0.98]"
            onClick={() => {
              void refreshOverview();
              void refreshProducts();
              void refreshActivity();
            }}
          >
            Refresh data
          </Button>
        </div>
      </header>

      {hasError ? (
        <Alert variant="destructive" className="mt-6 rounded-2xl">
          <AlertTriangle className="size-4" />
          <AlertTitle>Some dashboard data could not be loaded</AlertTitle>
          <AlertDescription>
            We could not fetch one or more analytics panels. Try refreshing data or check API auth cookies.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {isOverviewLoading
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
          : (
            [
              {
                title: "Total Revenue Today",
                value: formatCurrency(overview.today.totalRevenue),
                icon: CircleDollarSign,
              },
              {
                title: "Total Revenue This Week",
                value: formatCurrency(overview.week.totalRevenue),
                icon: TrendingUp,
              },
              {
                title: "Total Revenue This Month",
                value: formatCurrency(overview.month.totalRevenue),
                icon: CircleDollarSign,
              },
              {
                title: "Conversion Rate",
                value: formatPercent(overview.today.conversionRate),
                icon: MousePointerClick,
              },
              {
                title: "Total Events",
                value: formatInteger(overview.today.totalEvents),
                icon: Activity,
              },
              {
                title: "Purchase Count",
                value: formatInteger(overview.today.purchaseCount),
                icon: ShoppingBag,
              },
            ].map((card, index) => (
              <Card
                key={card.title}
                className="panel-surface fade-up rounded-2xl border-white/70 bg-white/78"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardDescription className="max-w-[10ch] text-[0.78rem] font-medium leading-4 tracking-[-0.01em] text-slate-600">
                    {card.title}
                  </CardDescription>
                  <div className="flex size-8 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary/80 shadow-sm">
                    <card.icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="font-sans font-semibold leading-none tracking-[-0.04em] text-slate-900 md:text-xl text-md">
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="panel-surface fade-up rounded-3xl border-white/65 bg-white/75" style={{ animationDelay: "120ms" }}>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Top Products</CardTitle>
            <CardDescription>Highest-performing products by purchase revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            {isProductsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={`product-row-skeleton-${idx}`} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : productsError ? (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="size-4" />
                <AlertTitle>Top products unavailable</AlertTitle>
                <AlertDescription>
                  We could not load product rankings right now.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Rank</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Purchase Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No product data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={`${product.productId ?? "unknown"}-${product.rank}`}>
                        <TableCell className="font-medium">#{product.rank}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatInteger(product.purchaseCount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="panel-surface fade-up rounded-3xl border-white/65 bg-white/75" style={{ animationDelay: "170ms" }}>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Recent Activity</CardTitle>
            <CardDescription>Latest user behavior and checkout actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={`activity-skeleton-${idx}`} className="space-y-2">
                    <Skeleton className="h-4 w-2/5 rounded-md" />
                    <Skeleton className="h-4 w-4/5 rounded-md" />
                    {idx < 7 ? <Separator /> : null}
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="size-4" />
                <AlertTitle>Recent activity unavailable</AlertTitle>
                <AlertDescription>
                  We could not load recent events. Please retry.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-115 space-y-3 overflow-auto pr-1">
                {activity.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No events recorded yet.</p>
                ) : (
                  activity.map((event) => (
                    <article key={event.eventId ?? `${event.timestamp}-${event.eventType}`} className="rounded-xl border border-border/70 bg-white/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={eventColorClass(event.eventType)}>
                          {event.eventType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                        <p>
                          Product: <span className="font-medium text-foreground">{event.productId ?? "-"}</span>
                        </p>
                        <p>
                          Amount:{" "}
                          <span className="font-medium text-foreground">
                            {event.amount == null ? "-" : formatCurrency(event.amount)}
                          </span>
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
