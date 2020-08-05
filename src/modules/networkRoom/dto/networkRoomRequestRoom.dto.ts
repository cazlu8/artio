import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class NetworkRoomRequestRoomDto {
  @IsNumber()
  @ApiProperty({ type: 'string' })
  eventId: number;

  @IsNumber()
  @ApiProperty({ type: 'string' })
  userId: number;
}
