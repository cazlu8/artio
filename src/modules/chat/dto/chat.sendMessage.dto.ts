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
  toGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  fromGuid: string;
}
