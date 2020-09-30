import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EventConnectToLiveEventDto {
  @IsNotEmpty()
  @ApiProperty()
  eventId: number;
}
