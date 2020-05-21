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
  title: string;

  // the start day of week from the event
  @ApiProperty()
  @IsNotEmpty()
  day: string;

  // formatting (month startDay-endDay, year(of the startDate))
  @ApiProperty()
  @IsNotEmpty()
  date: string;

  // formatting (location_name, city, state_acronym)
  @ApiProperty()
  @IsNotEmpty()
  location: string;
}
