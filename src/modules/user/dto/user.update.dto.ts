import { IsPhoneNumber, IsUrl, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../enums/user.gender.enum';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName?: string;

  @IsUrl()
  @ApiProperty()
  avatarImgUrl?: string;

  @ApiProperty()
  @IsNotEmpty()
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

  @IsUrl()
  @ApiProperty()
  twitterUrl?: string;

  @IsUrl()
  @ApiProperty()
  instagramUrl?: string;

  @IsUrl()
  @ApiProperty()
  linkedinUrl?: string;

  @IsUrl()
  @ApiProperty()
  facebookUrl?: string;

  @ApiProperty()
  isNew?: boolean;
}
