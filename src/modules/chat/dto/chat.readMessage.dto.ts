import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class ReadMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  toUserGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  messageGuid: string;
}
