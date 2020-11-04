import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class RegisterSessionParticipantDTO {
  @ApiProperty()
  @IsNotEmpty()
  streamRole: string;
}
