import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { count, eq, gte, sql, sum } from 'drizzle-orm'
import { db } from 'src/database/db'
import { events, preAggregatedMetrics, stores } from 'src/database/schema'
import { redis } from 'src/redis/redis.client'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handlePreaggregationJob() {
    this.logger.debug('Running pre-aggregation job...')

    const todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const allStores = await db.select().from(stores)

    // Each query groups by storeId and aggregates in the DB
    // Only 5 rows come back per query (one per store)
    const [todayStats, weekStats, monthStats] = await Promise.all([
      db
        .select({
          storeId: events.storeId,
          totalRevenue: sum(events.amount),
          purchaseCount: count(eq(events.eventType, 'purchase')),
          pageViewCount: count(eq(events.eventType, 'page_view')),
          totalEvents: count(),
        })
        .from(events)
        .where(gte(events.timestamp, todayStart))
        .groupBy(events.storeId),

      db
        .select({
          storeId: events.storeId,
          totalRevenue: sum(events.amount),
          purchaseCount: count(eq(events.eventType, 'purchase')),
          pageViewCount: count(eq(events.eventType, 'page_view')),
          totalEvents: count(),
        })
        .from(events)
        .where(gte(events.timestamp, weekAgo))
        .groupBy(events.storeId),

      db
        .select({
          storeId: events.storeId,
          totalRevenue: sum(events.amount),
          purchaseCount: count(eq(events.eventType, 'purchase')),
          pageViewCount: count(eq(events.eventType, 'page_view')),
          totalEvents: count(),
        })
        .from(events)
        .where(gte(events.timestamp, monthAgo))
        .groupBy(events.storeId),
    ])

    for (const store of allStores) {
      const todayRow = todayStats.find((s) => s.storeId === store.id)
      const weekRow = weekStats.find((s) => s.storeId === store.id)
      const monthRow = monthStats.find((s) => s.storeId === store.id)

      const conversionRate = (purchases: number, pageViews: number) =>
        pageViews > 0 ? purchases / pageViews : 0

      const overview = {
        today: {
          totalRevenue: parseFloat(todayRow?.totalRevenue ?? '0'),
          purchaseCount: todayRow?.purchaseCount ?? 0,
          pageViewCount: todayRow?.pageViewCount ?? 0,
          totalEvents: todayRow?.totalEvents ?? 0,
          conversionRate: conversionRate(
            todayRow?.purchaseCount ?? 0,
            todayRow?.pageViewCount ?? 0
          ),
        },
        week: {
          totalRevenue: parseFloat(weekRow?.totalRevenue ?? '0'),
          purchaseCount: weekRow?.purchaseCount ?? 0,
          pageViewCount: weekRow?.pageViewCount ?? 0,
          totalEvents: weekRow?.totalEvents ?? 0,
          conversionRate: conversionRate(
            weekRow?.purchaseCount ?? 0,
            weekRow?.pageViewCount ?? 0
          ),
        },
        month: {
          totalRevenue: parseFloat(monthRow?.totalRevenue ?? '0'),
          purchaseCount: monthRow?.purchaseCount ?? 0,
          pageViewCount: monthRow?.pageViewCount ?? 0,
          totalEvents: monthRow?.totalEvents ?? 0,
          conversionRate: conversionRate(
            monthRow?.purchaseCount ?? 0,
            monthRow?.pageViewCount ?? 0
          ),
        },
      }

      await redis.set(
        `analytics:${store.id}:overview`,
        JSON.stringify(overview),
        'EX',
        120 // expires in 120 seconds
      )

      // onConflictDoUpdate because storeId+period row already
      // exists after the first cron run — update it instead
      await db
        .insert(preAggregatedMetrics)
        .values([
          {
            storeId: store.id,
            period: 'today',
            totalRevenue: overview.today.totalRevenue.toString(),
            purchaseCount: overview.today.purchaseCount,
            pageViewCount: overview.today.pageViewCount,
            totalEvents: overview.today.totalEvents,
            conversionRate: overview.today.conversionRate.toString(),
          },
          {
            storeId: store.id,
            period: 'week',
            totalRevenue: overview.week.totalRevenue.toString(),
            purchaseCount: overview.week.purchaseCount,
            pageViewCount: overview.week.pageViewCount,
            totalEvents: overview.week.totalEvents,
            conversionRate: overview.week.conversionRate.toString(),
          },
          {
            storeId: store.id,
            period: 'month',
            totalRevenue: overview.month.totalRevenue.toString(),
            purchaseCount: overview.month.purchaseCount,
            pageViewCount: overview.month.pageViewCount,
            totalEvents: overview.month.totalEvents,
            conversionRate: overview.month.conversionRate.toString(),
          },
        ])
        .onConflictDoUpdate({
          target: [preAggregatedMetrics.storeId, preAggregatedMetrics.period],
          set: {
            totalRevenue: sql`excluded.total_revenue`,
            purchaseCount: sql`excluded.purchase_count`,
            pageViewCount: sql`excluded.page_view_count`,
            totalEvents: sql`excluded.total_events`,
            conversionRate: sql`excluded.conversion_rate`,
            computedAt: sql`now()`,
          },
        })

      this.logger.debug(`Updated metrics for store ${store.id}`)
    }
  }
}
