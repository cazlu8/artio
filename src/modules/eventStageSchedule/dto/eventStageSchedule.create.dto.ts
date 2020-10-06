import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDate, IsNumber } from 'class-validator';

export default class EventStageScheduleCreateDTO {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @IsDate()
  endDate: Date;

  @ApiProperty()
  @IsNumber()
  eventStageId: number;
}
