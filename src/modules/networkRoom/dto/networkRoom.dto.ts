import { ApiProperty } from '@nestjs/swagger';

export class NetworkRoomDto {
  @ApiProperty({ type: 'string' })
  sid: string;

  @ApiProperty({ type: 'string' })
  uniqueName: string;
}
