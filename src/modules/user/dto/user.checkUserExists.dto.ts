import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckUserExistsDto {
  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
