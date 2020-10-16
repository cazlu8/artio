import { IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSponsorScheduleCallDto {
  @ApiProperty()
  @IsNotEmpty()
  sponsorId: number;

  @ApiProperty()
  @IsDateString()
  time: Date;
}
