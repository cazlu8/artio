import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class RoleListDto {
  @IsNotEmpty()
  @ApiProperty()
  role: number;
}
