import { Body, Controller, Post } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto';
import { db } from 'src/database/db';
import { events } from 'src/database/schema';

@Controller('events')
export class EventsController {
  @Post('ingest')
  async updateEventData(@Body() ingestDto: IngestDto) {
    // const returning = await db
    //   .insert(events)
    //   .values(ingestDto.events as any)
    //   .returning({
    //     id: events.id,
    //   });
    //
    console.log('Created', ingestDto.events);
  }
}
