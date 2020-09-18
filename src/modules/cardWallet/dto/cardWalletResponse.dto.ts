import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsNotEmpty, IsBoolean } from 'class-validator';

export class CardWalletResponseCardDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  requestingUserGuid: string;

  @IsBoolean()
  @ApiProperty({ type: 'string' })
  accept: boolean;

  @IsNumber()
  @ApiProperty({ type: 'string' })
  eventId: number;

  @IsObject()
  auth: { token: string };
}
