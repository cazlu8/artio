import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkSpeakerToScheduleDTO {
  @ApiProperty()
  @IsNumber()
  speakerId: number;

  @ApiProperty()
  @IsNumber()
  scheduleId: number;
}
