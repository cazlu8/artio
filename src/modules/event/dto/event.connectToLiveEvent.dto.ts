import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export default class EventConnectToLiveEventDto {
  @IsNotEmpty()
  @ApiProperty()
  eventId: number;

  @IsObject()
  auth: { token: string };
}
