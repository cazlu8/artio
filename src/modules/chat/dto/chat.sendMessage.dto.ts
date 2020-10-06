import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class SendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  toUserGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  fromUserName: string;

  @ApiProperty()
  @IsNotEmpty()
  message: string;
}
