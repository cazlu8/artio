import { IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NetworkRoomRequestAvailableRoomDto {
  @IsNumber()
  @ApiProperty({ type: 'string' })
  eventId: number;

  @IsObject()
  auth: { token: string };
}
