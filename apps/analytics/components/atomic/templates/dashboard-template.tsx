'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  AlertTriangle,
  CircleDollarSign,
  MousePointerClick,
  ShoppingBag,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { DashboardHeader } from '@/components/atomic/organisms/dashboard-header'
import { DashboardFilters } from '@/components/atomic/molecules/dashboard-filters'
import { DashboardOverviewGrid } from '@/components/atomic/organisms/dashboard-overview-grid'
import { TopProductsTable } from '@/components/atomic/organisms/top-products-table'
import { RecentActivityFeed } from '@/components/atomic/organisms/recent-activity-feed'
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
} from '@/lib/analytics/dashboard'
import { formatCurrency, formatInteger, formatPercent } from '@/lib/format'

const createFetchers = () => {
  const identityFetcher = () =>
    apiGet<{
      ownerName: string
      ownerEmail: string
      storeName: string
      storeId: string | null
    }>('/auth/me')
  const metricFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<{ data: unknown }>(
      '/analytics/overview',
      buildFilterPayload(period, startDate, endDate)
    )

  const topProductsFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<{ data: TopProduct[] }>(
      '/analytics/top-products',
      buildFilterPayload(period, startDate, endDate)
    )

  const activityFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<{ data: RecentEvent[] }>(
      '/analytics/recent-activity',
      buildFilterPayload(period, startDate, endDate)
    )

  return { identityFetcher, metricFetcher, topProductsFetcher, activityFetcher }
}

export function DashboardTemplate() {
  const router = useRouter()
  const [range, setRange] = useState<TimeRange>('week')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [gainFlash, setGainFlash] = useState<Record<string, boolean>>({})
  const [timeTick, setTimeTick] = useState(Date.now())
  const previousMetricsRef = useRef<Record<string, number>>({})

  const {
    identityFetcher,
    metricFetcher,
    topProductsFetcher,
    activityFetcher,
  } = useMemo(() => createFetchers(), [])
  const filtersKey = ['analytics-filters', range, startDate, endDate] as const

  const { data: identityData, isLoading: isIdentityLoading } = useSWR(
    'analytics-identity',
    identityFetcher,
    { keepPreviousData: true }
  )

  const {
    data: overviewData,
    error: overviewError,
    isLoading: isOverviewLoading,
    mutate: refreshOverview,
  } = useSWR(filtersKey, metricFetcher, {
    refreshInterval: 1000,
    keepPreviousData: true,
  })

  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
    mutate: refreshProducts,
  } = useSWR(
    ['analytics-top-products', ...filtersKey.slice(1)] as const,
    topProductsFetcher,
    {
      refreshInterval: 1000,
      keepPreviousData: true,
    }
  )

  const {
    data: activityData,
    error: activityError,
    isLoading: isActivityLoading,
    mutate: refreshActivity,
  } = useSWR(
    ['analytics-recent-activity', ...filtersKey.slice(1)] as const,
    activityFetcher,
    {
      refreshInterval: 1000,
      keepPreviousData: true,
    }
  )

  const overview = normalizeOverview(overviewData)
  const products = normalizeTopProducts(productsData)
  const activity = normalizeRecentActivity(activityData)
  const isLiveView = range === 'today' && !startDate && !endDate
  const selectedMetrics = overview.selectedPeriod

  const filterWindowLabel = useMemo(() => {
    const start = new Date(overview.selectedWindow.start)
    const end = new Date(overview.selectedWindow.end)

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })

    const safeStart = Number.isNaN(start.getTime())
      ? 'selected start'
      : dateFormatter.format(start)
    const safeEnd = Number.isNaN(end.getTime())
      ? 'selected end'
      : dateFormatter.format(end)

    return `Showing data from ${safeStart} to ${safeEnd}`
  }, [overview.selectedWindow.end, overview.selectedWindow.start])

  const filterWindowTitle = useMemo(() => {
    if (range === 'custom') {
      return 'Metrics For Custom Range'
    }

    if (range === 'today') {
      return 'Metrics For Today'
    }

    if (range === 'month') {
      return 'Metrics For This Month'
    }

    return 'Metrics For This Week'
  }, [range])

  const metricCards: DashboardMetricCard[] = useMemo(
    () => [
      {
        key: 'today-revenue',
        title: 'Total Revenue Today',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.today.totalRevenue)),
        numericValue: toNumericValue(overview.today.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        key: 'week-revenue',
        title: 'Total Revenue This Week',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.week.totalRevenue)),
        numericValue: toNumericValue(overview.week.totalRevenue),
        icon: TrendingUp,
      },
      {
        key: 'month-revenue',
        title: 'Total Revenue This Month',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.month.totalRevenue)),
        numericValue: toNumericValue(overview.month.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        key: 'conversion-rate',
        title: 'Conversion Rate',
        value: `${new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(toNumericValue(overview.today.conversionRate))}%`,
        numericValue: toNumericValue(overview.today.conversionRate),
        icon: MousePointerClick,
      },
      {
        key: 'total-events',
        title: 'Total Events',
        value: new Intl.NumberFormat('en-US').format(
          toNumericValue(overview.today.totalEvents)
        ),
        numericValue: toNumericValue(overview.today.totalEvents),
        icon: Activity,
      },
      {
        key: 'purchase-count',
        title: 'Purchase Count',
        value: new Intl.NumberFormat('en-US').format(
          toNumericValue(overview.today.purchaseCount)
        ),
        numericValue: toNumericValue(overview.today.purchaseCount),
        icon: ShoppingBag,
      },
    ],
    [overview]
  )

  const filteredMetricCards: DashboardMetricCard[] = useMemo(
    () => [
      {
        key: 'selected-revenue',
        title: 'Total Revenue',
        value: formatCurrency(selectedMetrics.totalRevenue),
        numericValue: toNumericValue(selectedMetrics.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        key: 'selected-conversion-rate',
        title: 'Conversion Rate',
        value: formatPercent(selectedMetrics.conversionRate),
        numericValue: toNumericValue(selectedMetrics.conversionRate),
        icon: MousePointerClick,
      },
      {
        key: 'selected-total-events',
        title: 'Total Events',
        value: formatInteger(selectedMetrics.totalEvents),
        numericValue: toNumericValue(selectedMetrics.totalEvents),
        icon: Activity,
      },
      {
        key: 'selected-purchase-count',
        title: 'Purchase Count',
        value: formatInteger(selectedMetrics.purchaseCount),
        numericValue: toNumericValue(selectedMetrics.purchaseCount),
        icon: ShoppingBag,
      },
      {
        key: 'selected-page-view-count',
        title: 'Page Views',
        value: formatInteger(selectedMetrics.pageViewCount),
        numericValue: toNumericValue(selectedMetrics.pageViewCount),
        icon: TrendingUp,
      },
      {
        key: 'selected-aov',
        title: 'Avg Revenue / Purchase',
        value: formatCurrency(
          toNumericValue(selectedMetrics.purchaseCount) > 0
            ? toNumericValue(selectedMetrics.totalRevenue) /
                toNumericValue(selectedMetrics.purchaseCount)
            : 0
        ),
        numericValue:
          toNumericValue(selectedMetrics.purchaseCount) > 0
            ? toNumericValue(selectedMetrics.totalRevenue) /
              toNumericValue(selectedMetrics.purchaseCount)
            : 0,
        icon: CircleDollarSign,
      },
    ],
    [selectedMetrics]
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const nextFlash: Record<string, boolean> = {}
    let shouldUpdate = false

    for (const card of metricCards) {
      const previous = previousMetricsRef.current[card.key]
      if (previous !== undefined && card.numericValue > previous) {
        nextFlash[card.key] = true
        shouldUpdate = true
      }
    }

    previousMetricsRef.current = Object.fromEntries(
      metricCards.map((card) => [card.key, card.numericValue])
    )

    if (!shouldUpdate) {
      return
    }

    setGainFlash((current) => ({ ...current, ...nextFlash }))

    const timeoutId = window.setTimeout(() => {
      setGainFlash((current) => {
        const cleared = { ...current }
        for (const key of Object.keys(nextFlash)) {
          delete cleared[key]
        }
        return cleared
      })
    }, 1100)

    return () => window.clearTimeout(timeoutId)
  }, [metricCards])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await apiPost('/auth/logout')
      router.replace('/login')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleGoLive = () => {
    setRange('today')
    setStartDate('')
    setEndDate('')
  }

  const hasError = Boolean(overviewError || productsError || activityError)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <DashboardHeader
        onRefresh={() => {
          void refreshOverview()
          void refreshProducts()
          void refreshActivity()
        }}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        storeName={identityData?.storeName}
        ownerName={identityData?.ownerName}
        isIdentityLoading={isIdentityLoading}
      />

      <DashboardFilters
        range={range}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearDates={() => {
          setStartDate('')
          setEndDate('')
        }}
        onGoLive={handleGoLive}
        isLiveView={isLiveView}
      />

      {hasError ? (
        <div
          className="mt-6 rounded-2xl border border-destructive/20
            bg-destructive/5 p-4 text-sm text-destructive"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4" />
            <div>
              <p className="font-medium">
                Some dashboard data could not be loaded
              </p>
              <p className="mt-1 text-destructive/80">
                We could not fetch one or more analytics panels. Try refreshing
                data or check API auth cookies.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <DashboardOverviewGrid
        cards={metricCards}
        gainFlash={gainFlash}
        isLoading={isOverviewLoading}
      />

      <section className="mt-6">
        <div
          className="flex flex-col gap-2 rounded-2xl border border-border/70
            bg-white/70 px-4 py-3 md:flex-row md:items-center
            md:justify-between"
        >
          <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
            {filterWindowTitle}
          </p>
          <p className="text-xs text-muted-foreground md:text-sm">
            {filterWindowLabel}
          </p>
        </div>

        <DashboardOverviewGrid
          cards={filteredMetricCards}
          gainFlash={{}}
          isLoading={isOverviewLoading}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <TopProductsTable
          products={products}
          isLoading={isProductsLoading}
          hasError={Boolean(productsError)}
        />
        <RecentActivityFeed
          events={activity}
          isLoading={isActivityLoading}
          hasError={Boolean(activityError)}
          timeTick={timeTick}
        />
      </section>
    </main>
  )
}
