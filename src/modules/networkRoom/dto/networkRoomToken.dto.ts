import { ApiProperty } from '@nestjs/swagger';

export class NetworkRoomTokenDto {
  @ApiProperty({ type: 'string' })
  identity: string;

  @ApiProperty({ type: 'string' })
  room: string;
}
