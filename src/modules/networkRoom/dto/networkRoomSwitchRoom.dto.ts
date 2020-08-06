import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class NetworkRoomSwitchRoomDto {
  @IsString()
  @ApiProperty({ type: 'string' })
  currentRoom: string;

  @IsNumber()
  @ApiProperty({ type: 'string' })
  eventId: number;
}
