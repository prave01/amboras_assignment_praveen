import { Controller, Get, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

@Controller("analytics")
export class AnalyticsController {
  @Get("overview")
  getOveriew() {
    // here goes the db call for getting the overview
  }
}
