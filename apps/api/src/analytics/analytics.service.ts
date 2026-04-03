import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { and, eq, gte } from "drizzle-orm";
import { db } from "src/database/db";
import { events } from "src/database/schema";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePreaggregationJob() {
    this.logger.debug("Running pre-aggregation job...");

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const today = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.timestamp, twentyFourHoursAgo),
          eq(events.eventType, "purchase"),
        ),
      );

    console.log(
      today.map((e) => ({
        eventId: e.eventId,
        storeId: e.storeId,
        eventType: e.eventType,
        timestamp: e.timestamp.toISOString(),
        productId: e.productId,
        amount: e.amount,
        currency: e.currency,
      })),
    );

    this.logger.debug(
      `Pre-aggregation job completed. Processed ${today.length} events.`,
    );
  }
}
