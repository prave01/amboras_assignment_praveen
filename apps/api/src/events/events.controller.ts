import { Body, Controller, Post } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto';
import { db } from 'src/database/db';
import { events, UserInsert } from 'src/database/schema';

@Controller('events')
export class EventsController {
  @Post('ingest')
  updateEventData(@Body() ingestDto: IngestDto) {
    db.insert(events).values(ingestDto as UserInsert[]);
  }
}
