import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export type Role = 'subscriber' | 'publisher' | 'moderator';

export default class RegisterSessionParticipantDTO {
  @ApiProperty()
  @IsNotEmpty()
  streamRole: Role;
}
