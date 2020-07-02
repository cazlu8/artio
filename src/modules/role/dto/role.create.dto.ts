import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class CreateRoleDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: number;
}
