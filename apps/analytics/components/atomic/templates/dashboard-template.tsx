"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle, CircleDollarSign, MousePointerClick, ShoppingBag, TrendingUp, Activity } from "lucide-react";
import { apiPost } from "@/lib/api";
import { DashboardHeader } from "@/components/atomic/organisms/dashboard-header";
import { DashboardFilters } from "@/components/atomic/molecules/dashboard-filters";
import { DashboardOverviewGrid } from "@/components/atomic/organisms/dashboard-overview-grid";
import { TopProductsTable } from "@/components/atomic/organisms/top-products-table";
import { RecentActivityFeed } from "@/components/atomic/organisms/recent-activity-feed";
import {
  buildFilterPayload,
  normalizeOverview,
  normalizeRecentActivity,
  normalizeTopProducts,
  toNumericValue,
  type DashboardMetricCard,
  type RecentEvent,
  type TimeRange,
  type TopProduct,
} from "@/lib/analytics/dashboard";

const createFetchers = () => {
  const metricFetcher = ([, period, startDate, endDate]: [string, TimeRange, string, string]) =>
    apiPost<{ data: unknown }>("/analytics/overview", buildFilterPayload(period, startDate, endDate));

  const topProductsFetcher = ([, period, startDate, endDate]: [string, TimeRange, string, string]) =>
    apiPost<{ data: TopProduct[] }>("/analytics/top-products", buildFilterPayload(period, startDate, endDate));

  const activityFetcher = ([, period, startDate, endDate]: [string, TimeRange, string, string]) =>
    apiPost<{ data: RecentEvent[] }>("/analytics/recent-activity", buildFilterPayload(period, startDate, endDate));

  return { metricFetcher, topProductsFetcher, activityFetcher };
};

export function DashboardTemplate() {
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [gainFlash, setGainFlash] = useState<Record<string, boolean>>({});
  const [timeTick, setTimeTick] = useState(Date.now());
  const previousMetricsRef = useRef<Record<string, number>>({});

  const { metricFetcher, topProductsFetcher, activityFetcher } = useMemo(() => createFetchers(), []);
  const filtersKey = ["analytics-filters", range, startDate, endDate] as const;

  const {
    data: overviewData,
    error: overviewError,
    isLoading: isOverviewLoading,
    mutate: refreshOverview,
  } = useSWR(filtersKey, metricFetcher, { refreshInterval: 20000, keepPreviousData: true });

  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
    mutate: refreshProducts,
  } = useSWR(["analytics-top-products", ...filtersKey.slice(1)] as const, topProductsFetcher, {
    refreshInterval: 45000,
    keepPreviousData: true,
  });

  const {
    data: activityData,
    error: activityError,
    isLoading: isActivityLoading,
    mutate: refreshActivity,
  } = useSWR(["analytics-recent-activity", ...filtersKey.slice(1)] as const, activityFetcher, {
    refreshInterval: 10000,
    keepPreviousData: true,
  });

  const overview = normalizeOverview(overviewData);
  const products = normalizeTopProducts(productsData);
  const activity = normalizeRecentActivity(activityData);
  const isCustomRange = range === "custom";
  const isLiveView = range === "today" && !startDate && !endDate;

  const metricCards: DashboardMetricCard[] = useMemo(
    () => [
      {
        key: "today-revenue",
        title: "Total Revenue Today",
        value: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.today.totalRevenue)),
        numericValue: toNumericValue(overview.today.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        key: "week-revenue",
        title: "Total Revenue This Week",
        value: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.week.totalRevenue)),
        numericValue: toNumericValue(overview.week.totalRevenue),
        icon: TrendingUp,
      },
      {
        key: "month-revenue",
        title: "Total Revenue This Month",
        value: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.month.totalRevenue)),
        numericValue: toNumericValue(overview.month.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        key: "conversion-rate",
        title: "Conversion Rate",
        value: `${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.today.conversionRate))}%`,
        numericValue: toNumericValue(overview.today.conversionRate),
        icon: MousePointerClick,
      },
      {
        key: "total-events",
        title: "Total Events",
        value: new Intl.NumberFormat("en-US").format(toNumericValue(overview.today.totalEvents)),
        numericValue: toNumericValue(overview.today.totalEvents),
        icon: Activity,
      },
      {
        key: "purchase-count",
        title: "Purchase Count",
        value: new Intl.NumberFormat("en-US").format(toNumericValue(overview.today.purchaseCount)),
        numericValue: toNumericValue(overview.today.purchaseCount),
        icon: ShoppingBag,
      },
    ],
    [overview],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const nextFlash: Record<string, boolean> = {};
    let shouldUpdate = false;

    for (const card of metricCards) {
      const previous = previousMetricsRef.current[card.key];
      if (previous !== undefined && card.numericValue > previous) {
        nextFlash[card.key] = true;
        shouldUpdate = true;
      }
    }

    previousMetricsRef.current = Object.fromEntries(metricCards.map((card) => [card.key, card.numericValue]));

    if (!shouldUpdate) {
      return;
    }

    setGainFlash((current) => ({ ...current, ...nextFlash }));

    const timeoutId = window.setTimeout(() => {
      setGainFlash((current) => {
        const cleared = { ...current };
        for (const key of Object.keys(nextFlash)) {
          delete cleared[key];
        }
        return cleared;
      });
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [metricCards]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await apiPost("/auth/logout");
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoLive = () => {
    setRange("today");
    setStartDate("");
    setEndDate("");
  };

  const hasError = Boolean(overviewError || productsError || activityError);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <DashboardHeader
        onRefresh={() => {
          void refreshOverview();
          void refreshProducts();
          void refreshActivity();
        }}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <DashboardFilters
        range={range}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearDates={() => {
          setStartDate("");
          setEndDate("");
        }}
        onGoLive={handleGoLive}
        isLiveView={isLiveView}
      />

      {hasError ? (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4" />
            <div>
              <p className="font-medium">Some dashboard data could not be loaded</p>
              <p className="mt-1 text-destructive/80">
                We could not fetch one or more analytics panels. Try refreshing data or check API auth cookies.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <DashboardOverviewGrid cards={metricCards} gainFlash={gainFlash} isLoading={isOverviewLoading} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <TopProductsTable products={products} isLoading={isProductsLoading} hasError={Boolean(productsError)} />
        <RecentActivityFeed
          events={activity}
          isLoading={isActivityLoading}
          hasError={Boolean(activityError)}
          timeTick={timeTick}
        />
      </section>
    </main>
  );
}
