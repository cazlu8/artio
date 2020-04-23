import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  guid: string;

  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
