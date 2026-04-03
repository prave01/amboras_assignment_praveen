import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { redis } from 'src/redis/redis.client';
import { JwtAuthGuard } from 'src/auth/passport/jwt.guard';
import { db } from 'src/database/db';
import { eq } from 'drizzle-orm';
import { preAggregatedMetrics } from 'src/database/schema';

@Controller('analytics')
export class AnalyticsController {
  @UseGuards(JwtAuthGuard)
  @Post('overview')
  async getOveriew(@Request() req) {
    const storeId = req.user.storeId;

    const preAggregatedData = await redis.get(`analytics:${storeId}:overview`);

    if (preAggregatedData) {
      return {
        message: 'cache-hit',
        data: JSON.parse(preAggregatedData),
      };
    }

    const overview = await db.query.preAggregatedMetrics.findFirst({
      where: eq(preAggregatedMetrics.storeId, storeId),
    });

    return {
      message: 'cache-miss',
      data: overview,
    };
  }
}
