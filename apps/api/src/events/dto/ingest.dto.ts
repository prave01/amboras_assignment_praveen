export class EventDataDto {
  product_id?: string;
  amount?: number;
  currency?: string;
}

export class EventDto {
  event_id: string;
  store_id: string;
  event_type: string;
  timestamp: string;
  data: EventDataDto;
}

export class IngestDto {
  events: EventDto[];
}
