import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../enums/user.gender.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  guid: string;

  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  firstName?: string;

  @ApiProperty()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  bio?: string;

  @IsOptional()
  @IsPhoneNumber('ZZ')
  @ApiProperty()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(UserGender)
  @ApiProperty()
  gender?: UserGender;

  @ApiProperty()
  @IsOptional()
  company?: string;

  @ApiProperty()
  @IsOptional()
  currentPosition?: string;

  @IsOptional()
  @ApiProperty()
  socialUrls?: string;
}
