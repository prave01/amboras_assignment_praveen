import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { BullModule } from "@nestjs/bullmq";
import { UsersModule } from "./users/users.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    EventsModule,
    AnalyticsModule,
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
