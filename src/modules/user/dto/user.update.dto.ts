import { IsPhoneNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../enums/user.gender.enum';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  bio?: string;

  @IsPhoneNumber('ZZ')
  @ApiProperty()
  phoneNumber?: string;

  @IsEnum(UserGender)
  @ApiProperty()
  gender?: UserGender;

  @ApiProperty()
  @IsNotEmpty()
  company?: string;

  @ApiProperty()
  @IsNotEmpty()
  currentPosition?: string;

  @IsOptional()
  @ApiProperty()
  socialUrls?: string;
}
