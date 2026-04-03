import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { IngestDto } from './dto/ingest.dto'
import { Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { JwtAuthGuard } from 'src/auth/passport/jwt.guard'

@Controller('events')
export class EventsController {
  constructor(@InjectQueue('events') private readonly eventsQueue: Queue) {}

  @Post('ingest')
  async updateEventData(@Body() ingestDto: IngestDto) {
    const job = await this.eventsQueue.add('ingest-batch', {
      events: ingestDto.events,
    })

    console.log(`Queued job id: ${job.id}, 
                 events: ${ingestDto.events.length}`)
    return { queued: ingestDto.events.length, jobId: job.id }
  }

  @Get('hi')
  @UseGuards(JwtAuthGuard)
  async hi(@Request() req) {
    return `Hi ${req.user.name}, you are loggedin`
  }
}
