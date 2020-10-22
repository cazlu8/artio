import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export default class SetupInfraDTO {
  @ApiProperty()
  @IsNotEmpty()
  region: string;

  @ApiProperty()
  @IsNumber()
  eventId: number;

  @ApiProperty()
  @IsNumber()
  stageId: number;
}
