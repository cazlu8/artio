import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EventStartIntermissionDto {
  @IsNotEmpty()
  @ApiProperty()
  eventId: number;

  // minutes
  @IsNotEmpty()
  @ApiProperty()
  intermissionTime: number;
}
