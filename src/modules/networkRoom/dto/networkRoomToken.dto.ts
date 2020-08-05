import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NetworkRoomTokenDto {
  @IsString()
  @ApiProperty({ type: 'string' })
  identity: string;

  @IsString()
  @ApiProperty({ type: 'string' })
  room: string;
}
