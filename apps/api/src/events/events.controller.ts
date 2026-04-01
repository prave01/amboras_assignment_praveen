import { Body, Controller, Post } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto';
import { db } from 'src/db/db';

@Controller('events')
export class EventsController {
  @Post('ingest')
  updateEventData(@Body() ingestDto: IngestDto) {
    // db logic for bulk insert
  }
}
