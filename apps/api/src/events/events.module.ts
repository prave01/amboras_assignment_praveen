import { Module } from "@nestjs/common";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";
import { BullModule } from "@nestjs/bullmq";
import { EventsProcessor } from "./event.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "events",
    }),
  ],
  providers: [EventsService, EventsProcessor],
  controllers: [EventsController],
})
export class EventsModule { }
