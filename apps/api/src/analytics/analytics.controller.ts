import {
  Controller,
  Body,
  Post,
  Request,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { redis } from 'src/redis/redis.client'
import { JwtAuthGuard } from 'src/auth/passport/jwt.guard'
import { db } from 'src/database/db'
import { and, count, desc, eq, gte, lte, sum } from 'drizzle-orm'
import {
  events,
  preAggregatedMetrics,
  products,
  topProductsCache,
} from 'src/database/schema'
import { ReqDto } from './dto/Req.dto'
import { AnalyticsFiltersDto } from './dto/analytics-filters.dto'

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name)

  private toPeriodMetrics(
    row:
      | {
          totalRevenue: string | null
          purchaseCount: number
          pageViewCount: number
          totalEvents: number
        }
      | undefined
  ) {
    const purchaseCount = row?.purchaseCount ?? 0
    const pageViewCount = row?.pageViewCount ?? 0
    const conversionRate = pageViewCount > 0 ? purchaseCount / pageViewCount : 0

    return {
      totalRevenue: Number(row?.totalRevenue ?? 0),
      purchaseCount,
      pageViewCount,
      totalEvents: row?.totalEvents ?? 0,
      conversionRate,
    }
  }

  private async computeLiveOverview(
    storeId: string,
    start: Date,
    end: Date
  ) {
    const rows = await db
      .select({
        totalRevenue: sum(events.amount),
        purchaseCount: count(eq(events.eventType, 'purchase')),
        pageViewCount: count(eq(events.eventType, 'page_view')),
        totalEvents: count(),
      })
      .from(events)
      .where(
        and(
          eq(events.storeId, storeId),
          gte(events.timestamp, start),
          lte(events.timestamp, end)
        )
      )

    return this.toPeriodMetrics(rows[0])
  }

  private resolveRange(filters?: AnalyticsFiltersDto) {
    const now = new Date()
    const period = filters?.period ?? 'week'

    if (period === 'custom') {
      const start = filters?.startDate
        ? new Date(filters.startDate)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const end = filters?.endDate ? new Date(filters.endDate) : now

      return { start, end, period }
    }

    const start =
      period === 'today'
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
        : period === 'month'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return { start, end: now, period }
  }

  @UseGuards(JwtAuthGuard)
  @Post('overview')
  async getOveriew(
    @Request() req: ReqDto,
    @Body() filters: AnalyticsFiltersDto
  ) {
    try {
      const storeId = req.user?.storeId

      if (!storeId) {
        throw new InternalServerErrorException('StoreId missing from JWT')
      }

      const range = this.resolveRange(filters)
      const cached = await redis.get(`analytics:${storeId}:overview`)

      const selectedMetrics = await this.computeLiveOverview(
        storeId,
        range.start,
        range.end
      )

      if (cached) {
        const parsed = JSON.parse(cached) as {
          today?: unknown
          week?: unknown
          month?: unknown
        }

        return {
          message: 'cache-hit',
          data: {
            ...parsed,
            selectedPeriod: selectedMetrics,
            selectedWindow: {
              period: range.period,
              start: range.start.toISOString(),
              end: range.end.toISOString(),
            },
          },
        }
      }

      const preAggregatedRows = await db
        .select({
          period: preAggregatedMetrics.period,
          totalRevenue: preAggregatedMetrics.totalRevenue,
          purchaseCount: preAggregatedMetrics.purchaseCount,
          pageViewCount: preAggregatedMetrics.pageViewCount,
          totalEvents: preAggregatedMetrics.totalEvents,
          conversionRate: preAggregatedMetrics.conversionRate,
        })
        .from(preAggregatedMetrics)
        .where(eq(preAggregatedMetrics.storeId, storeId))

      const periodOverview = {
        today: this.toPeriodMetrics(
          preAggregatedRows.find((row) => row.period === 'today')
        ),
        week: this.toPeriodMetrics(
          preAggregatedRows.find((row) => row.period === 'week')
        ),
        month: this.toPeriodMetrics(
          preAggregatedRows.find((row) => row.period === 'month')
        ),
      }

      return {
        message: 'cache-miss',
        data: {
          ...periodOverview,
          selectedPeriod: selectedMetrics,
          selectedWindow: {
            period: range.period,
            start: range.start.toISOString(),
            end: range.end.toISOString(),
          },
        },
      }
    } catch (error) {
      this.logger.error('Overview API failed', error)
      throw new InternalServerErrorException('Failed to fetch overview')
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('top-products')
  async getTopProducts(
    @Request() req: ReqDto,
    @Body() filters: AnalyticsFiltersDto
  ) {
    try {
      const storeId = req.user?.storeId

      if (!storeId) {
        throw new InternalServerErrorException('StoreId missing from JWT')
      }

      const range = this.resolveRange(filters)
      const cachedTopProducts =
        range.period !== 'custom'
          ? await db
              .select({
                productId: topProductsCache.productId,
                productName: topProductsCache.productName,
                totalRevenue: topProductsCache.totalRevenue,
                purchaseCount: topProductsCache.purchaseCount,
                rank: topProductsCache.rank,
              })
              .from(topProductsCache)
              .where(
                and(
                  eq(topProductsCache.storeId, storeId),
                  eq(topProductsCache.period, range.period)
                )
              )
              .orderBy(topProductsCache.rank)
              .limit(10)
          : []

      if (cachedTopProducts.length > 0) {
        return {
          message: 'success',
          data: cachedTopProducts.map((item, index) => ({
            rank: item.rank ?? index + 1,
            productId: item.productId,
            productName: item.productName ?? item.productId,
            totalRevenue: item.totalRevenue,
            purchaseCount: item.purchaseCount,
          })),
        }
      }

      const liveRows = await db
        .select({
          productId: events.productId,
          productName: products.name,
          amount: events.amount,
        })
        .from(events)
        .leftJoin(products, eq(events.productId, products.id))
        .where(
          and(
            eq(events.storeId, storeId),
            eq(events.eventType, 'purchase'),
            gte(events.timestamp, range.start),
            lte(events.timestamp, range.end)
          )
        )
        .orderBy(desc(events.timestamp))

      const topProducts = Array.from(
        liveRows
          .reduce(
            (accumulator, item) => {
              const key =
                item.productId ?? item.productName ?? 'unknown-product'
              const current = accumulator.get(key) ?? {
                productId: item.productId,
                productName: item.productName ?? item.productId,
                totalRevenue: 0,
                purchaseCount: 0,
              }

              current.totalRevenue += Number(item.amount ?? 0)
              current.purchaseCount += 1
              accumulator.set(key, current)

              return accumulator
            },
            new Map<
              string,
              {
                productId: string | null
                productName: string | null
                totalRevenue: number
                purchaseCount: number
              }
            >()
          )
          .values()
      )
        .sort((left, right) => right.totalRevenue - left.totalRevenue)
        .slice(0, 10)
        .map((item, index) => ({
          rank: index + 1,
          productId: item.productId,
          productName: item.productName ?? item.productId ?? 'Unknown product',
          totalRevenue: item.totalRevenue.toFixed(2),
          purchaseCount: item.purchaseCount,
        }))

      return {
        message: 'success',
        data: topProducts,
      }
    } catch (error) {
      this.logger.error('Top Products API failed', error)
      throw new InternalServerErrorException('Failed to fetch top products')
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('recent-activity')
  async recent_activity(
    @Request() req: ReqDto,
    @Body() filters: AnalyticsFiltersDto
  ) {
    try {
      const storeId = req.user.storeId
      const range = this.resolveRange(filters)
      const data = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.storeId, storeId as string),
            gte(events.timestamp, range.start),
            lte(events.timestamp, range.end)
          )
        )
        .orderBy(desc(events.timestamp))
        .limit(20)

      return {
        data,
      }
    } catch (err) {
      this.logger.error('Recent Activity API failed', err)
      throw new InternalServerErrorException('Failed to get recent activity')
    }
  }
}
