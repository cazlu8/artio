import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListUserEventDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'int' })
  id: number;

  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  name: string;
}
