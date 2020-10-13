import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export default class ReadMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  toUserGuid: string;

  @ApiProperty()
  @IsNotEmpty()
  messageGuid: string;

  @ApiProperty()
  @IsOptional()
  sponsorGuid?: string;
}
