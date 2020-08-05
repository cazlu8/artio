import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NetworkRoomSwitchRoomDto {
  @IsString()
  @ApiProperty({ type: 'string' })
  currentRoom: string;
}
