import { IsDateString, IsIn, IsOptional } from 'class-validator'

export class AnalyticsFiltersDto {
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'custom'])
  period?: 'today' | 'week' | 'month' | 'custom'

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}
