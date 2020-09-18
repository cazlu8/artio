import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsNotEmpty } from 'class-validator';

export class CardWalletRequestCardDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  requestingUserName: string;

  @IsNumber()
  @ApiProperty({ type: 'string' })
  requestedUserGuid: number;

  @IsObject()
  auth: { token: string };
}
