import {
  Controller,
  Post,
  Request,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { redis } from 'src/redis/redis.client';
import { JwtAuthGuard } from 'src/auth/passport/jwt.guard';
import { db } from 'src/database/db';
import { and, desc, eq, sum } from 'drizzle-orm';
import { events, preAggregatedMetrics } from 'src/database/schema';
import { ReqDto } from './dto/Req.dto';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  @UseGuards(JwtAuthGuard)
  @Post('overview')
  async getOveriew(@Request() req) {
    try {
      const storeId = req.user?.storeId;

      if (!storeId) {
        throw new InternalServerErrorException('StoreId missing from JWT');
      }

      const cached = await redis.get(`analytics:${storeId}:overview`);

      if (cached) {
        return {
          message: 'cache-hit',
          data: JSON.parse(cached),
        };
      }

      const overview = await db.query.preAggregatedMetrics.findFirst({
        where: eq(preAggregatedMetrics.storeId, storeId),
      });

      return {
        message: 'cache-miss',
        data: overview ?? {},
      };
    } catch (error) {
      this.logger.error('Overview API failed', error);
      throw new InternalServerErrorException('Failed to fetch overview');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('top-products')
  async getTopProducts(@Request() req: ReqDto) {
    try {
      const storeId = req.user?.storeId;

      if (!storeId) {
        throw new InternalServerErrorException('StoreId missing from JWT');
      }

      const revenueExpr = sum(events.amount);

      const topProducts = await db
        .select({
          productId: events.productId,
          revenue: revenueExpr,
        })
        .from(events)
        .where(
          and(eq(events.storeId, storeId), eq(events.eventType, 'purchase')),
        )
        .groupBy(events.productId)
        .orderBy(desc(revenueExpr))
        .limit(10);

      return {
        message: 'success',
        data: topProducts,
      };
    } catch (error) {
      this.logger.error('Top Products API failed', error);
      throw new InternalServerErrorException('Failed to fetch top products');
    }
  }
}
