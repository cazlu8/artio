import { IsEmail, IsPhoneNumber, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @IsUrl()
  @ApiProperty()
  avatarImgUrl: string;

  @ApiProperty()
  @IsNotEmpty()
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
