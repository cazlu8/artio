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

  @ApiProperty()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber('ZZ')
  phoneNumber?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiProperty()
  @IsNotEmpty()
  company?: string;

  @ApiProperty()
  @IsNotEmpty()
  currentPosition?: string;

  @ApiProperty()
  @IsOptional()
  socialUrls?: string;
}
