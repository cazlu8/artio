import { ApiProperty } from '@nestjs/swagger';

export class NetworkRoomRoomStatusDto {
  @ApiProperty({ type: 'string' })
  StatusCallbackEvent: string;

  @ApiProperty({ type: 'string' })
  RoomName: string;
}
