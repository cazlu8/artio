import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkToEventWithRoleDTO {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  roleId?: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  userId: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  eventId: number;
}
