import { Controller, Get } from "@nestjs/common";

@Controller("analytics")
export class AnalyticsController {
  @Get("overview")
  getOveriew() {
    // here goes the db call for getting the overview
  }
}
