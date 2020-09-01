import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EventListDto {
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @IsNotEmpty()
  @ApiProperty()
  heroImgUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  endDate: string;

  // formatting (location_name, city, state_acronym)
  @ApiProperty()
  @IsNotEmpty()
  locationName: string;

  @ApiProperty()
  @IsNotEmpty()
  onLive: boolean;
}
