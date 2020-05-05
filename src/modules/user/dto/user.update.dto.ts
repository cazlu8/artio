import { IsEmail, IsPhoneNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsUrl()
  @ApiProperty()
  avatarImgUrl: string;

  @ApiProperty()
  bio: string;

  @IsPhoneNumber('ZZ')
  @ApiProperty()
  phoneNumber: string;

  @IsUrl()
  @ApiProperty()
  twitterUrl: string;

  @IsUrl()
  @ApiProperty()
  instagramUrl: string;

  @IsUrl()
  @ApiProperty()
  linkedinUrl: string;

  @IsUrl()
  @ApiProperty()
  facebookUrl: string;

  @ApiProperty()
  isNew?: boolean;
}
