import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class SendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty()
  @IsNotEmpty()
  sponsorGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  toUserGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  fromUserName: string;

  @ApiProperty()
  @IsNotEmpty()
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  fromUserGuid: string;
}
