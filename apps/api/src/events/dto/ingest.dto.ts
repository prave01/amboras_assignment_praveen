import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from "class-validator";

const VALID_EVENT_TYPES = [
  "page_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_started",
  "purchase",
] as const;

export class EventDataDto {
  @IsOptional()
  @IsUUID()
  product_id?: string;

  // amount is required when event_type is purchase
  @ValidateIf((o) => o.amount !== undefined)
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class EventDto {
  @IsString()
  @IsNotEmpty()
  event_id: string;

  @IsUUID()
  store_id: string;

  @IsIn(VALID_EVENT_TYPES)
  event_type: string;

  @IsISO8601()
  timestamp: string;

  @ValidateNested()
  @Type(() => EventDataDto)
  data: EventDataDto;
}

export class IngestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events: EventDto[];
}
