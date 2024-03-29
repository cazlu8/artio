import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject } from 'class-validator';

export class NetworkRoomEventDefaultDto {
  @IsNumber()
  @ApiProperty({ type: 'string' })
  eventId: number;

  @IsNumber()
  @ApiProperty({ type: 'string' })
  userId: number;

  @IsObject()
  auth: { token: string };
}
