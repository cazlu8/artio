import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserEventDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  userId: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  eventId: number;
}
