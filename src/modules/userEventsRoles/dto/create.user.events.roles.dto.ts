import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserEventsRolesDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  userEventsId: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  roleId: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  userEventsUserId: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  userEventsEventId: number;
}
