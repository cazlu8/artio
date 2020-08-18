import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemEventCodeDTO {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  ticketCode: string;
}
