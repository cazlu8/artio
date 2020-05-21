import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import EventListDto from './event.list.dto';

export default class EventUpcomingListDto {
  @IsNotEmpty()
  @ApiProperty()
  events: EventListDto[];

  @IsNotEmpty()
  @ApiProperty()
  skip: number;

  @ApiProperty()
  @IsNotEmpty()
  ended: boolean;
}
