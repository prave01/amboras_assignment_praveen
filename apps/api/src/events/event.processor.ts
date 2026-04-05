import { Processor, WorkerHost } from '@nestjs/bullmq'
import { EventDto } from './dto/ingest.dto'
import { type Job } from 'bullmq'
import { events, type EventInsert } from '../../src/database/schema'
import { db } from '../../src/database/db'

@Processor('events')
export class EventsProcessor extends WorkerHost {
  async process(job: Job<{ events: EventDto[] }>): Promise<void> {
    try {
      const rows: EventInsert[] = job.data.events.map((event) => ({
        eventId: event.event_id,
        storeId: event.store_id,
        eventType: event.event_type,
        timestamp: new Date(event.timestamp),
        productId: event.data.product_id ?? null,
        amount: event.data.amount?.toString() ?? null,
        currency: event.data.currency ?? null,
      }))

      await db
        .insert(events)
        .values(rows)
        .onConflictDoNothing({ target: events.eventId })

      console.log(`Ingested ${rows.length} events (job: ${job.id})`)
    } catch (err) {
      console.error(`Failed to ingest job ${job.id}:`, err)
      throw err
    }
  }
}
