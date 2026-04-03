import { IsNotEmpty, IsString } from 'class-validator'

export class AnalyticsOverviewDto {
  @IsString()
  @IsNotEmpty()
  storeId: string
}
