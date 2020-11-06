import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export default class EventStageScheduleUpdateDTO {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiProperty()
  @IsDateString()
  endDate: Date;
}
