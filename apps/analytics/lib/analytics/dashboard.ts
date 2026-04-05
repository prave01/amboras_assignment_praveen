import type { LucideIcon } from 'lucide-react'
import { apiPost, type ApiEnvelope } from '@/lib/api'

export type TimeRange = 'today' | 'week' | 'month' | 'custom'

export type PeriodMetrics = {
  totalRevenue: number | string
  purchaseCount: number
  pageViewCount: number
  totalEvents: number
  conversionRate: number | string
}

export type OverviewResponse = {
  today: PeriodMetrics
  week: PeriodMetrics
  month: PeriodMetrics
  selectedPeriod: PeriodMetrics
  selectedWindow: {
    period: TimeRange
    start: string
    end: string
  }
}

export type TopProduct = {
  rank?: number
  productId: string | null
  productName?: string
  revenue?: number | string
  totalRevenue?: number | string
  purchaseCount?: number
}

export type RecentEvent = {
  eventId?: string
  storeId?: string
  eventType: string
  timestamp: string
  productId?: string | null
  amount?: number | string | null
  currency?: string | null
}

export type AnalyticsFilterPayload = {
  period: TimeRange
  startDate?: string
  endDate?: string
}

export type DashboardMetricCard = {
  key: string
  title: string
  value: string
  numericValue: number
  icon: LucideIcon
}

export function buildFilterPayload(
  period: TimeRange,
  startDate: string,
  endDate: string
): AnalyticsFilterPayload {
  if (period === 'custom') {
    return { period, startDate, endDate }
  }

  return { period }
}

export function createAnalyticsFetchers() {
  const metricFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<ApiEnvelope<unknown>>(
      '/analytics/overview',
      buildFilterPayload(period, startDate, endDate)
    )

  const topProductsFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<ApiEnvelope<TopProduct[]>>(
      '/analytics/top-products',
      buildFilterPayload(period, startDate, endDate)
    )

  const activityFetcher = ([, period, startDate, endDate]: [
    string,
    TimeRange,
    string,
    string,
  ]) =>
    apiPost<ApiEnvelope<RecentEvent[]>>(
      '/analytics/recent-activity',
      buildFilterPayload(period, startDate, endDate)
    )

  return { metricFetcher, topProductsFetcher, activityFetcher }
}

export function defaultPeriod(): PeriodMetrics {
  return {
    totalRevenue: 0,
    purchaseCount: 0,
    pageViewCount: 0,
    totalEvents: 0,
    conversionRate: 0,
  }
}

export function normalizeOverview(
  payload: ApiEnvelope<unknown> | undefined
): OverviewResponse {
  const raw = payload?.data

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'today' in raw &&
    'week' in raw &&
    'month' in raw
  ) {
    const overview = raw as {
      today: PeriodMetrics
      week: PeriodMetrics
      month: PeriodMetrics
      selectedPeriod?: PeriodMetrics
      selectedWindow?: {
        period?: TimeRange
        start?: string
        end?: string
      }
    }

    const nowIso = new Date().toISOString()

    return {
      today: overview.today,
      week: overview.week,
      month: overview.month,
      selectedPeriod: overview.selectedPeriod ?? overview.week,
      selectedWindow: {
        period: overview.selectedWindow?.period ?? 'week',
        start: overview.selectedWindow?.start ?? nowIso,
        end: overview.selectedWindow?.end ?? nowIso,
      },
    }
  }

  const base = {
    today: defaultPeriod(),
    week: defaultPeriod(),
    month: defaultPeriod(),
    selectedPeriod: defaultPeriod(),
    selectedWindow: {
      period: 'week' as TimeRange,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
  }

  if (typeof raw === 'object' && raw !== null && 'period' in raw) {
    const period = String((raw as { period?: unknown }).period ?? '')
    if (period === 'today' || period === 'week' || period === 'month') {
      base[period] = {
        ...defaultPeriod(),
        ...(raw as Partial<PeriodMetrics>),
      }
      base.selectedPeriod = base[period]
      base.selectedWindow.period = period
    }
  }

  return base
}

export function normalizeTopProducts(
  payload: ApiEnvelope<TopProduct[]> | undefined
): TopProduct[] {
  const records = Array.isArray(payload?.data) ? payload.data : []
  return records.slice(0, 10).map((product, index) => ({
    ...product,
    rank: product.rank ?? index + 1,
    productName: product.productName ?? product.productId ?? 'Unknown product',
    totalRevenue: product.totalRevenue ?? product.revenue ?? 0,
    purchaseCount: product.purchaseCount ?? 0,
  }))
}

export function normalizeRecentActivity(
  payload: ApiEnvelope<RecentEvent[]> | undefined
): RecentEvent[] {
  if (!Array.isArray(payload?.data)) {
    return []
  }

  return payload.data.slice(0, 20)
}

export function toNumericValue(
  value: number | string | null | undefined
): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function eventColorClass(eventType: string): string {
  switch (eventType) {
    case 'purchase':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'add_to_cart':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'remove_from_cart':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'checkout_started':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200'
  }
}
