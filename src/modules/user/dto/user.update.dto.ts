import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @IsNotEmpty()
  @ApiProperty()
  lastName: string;

  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  avatarImg: string;

  @IsNotEmpty()
  @ApiProperty()
  bio: string;

  @IsNotEmpty()
  @ApiProperty()
  phoneNumber: number;

  @IsNotEmpty()
  @ApiProperty()
  twitterUrl: string;

  @IsNotEmpty()
  @ApiProperty()
  instagramUrl: string;

  @IsNotEmpty()
  @ApiProperty()
  linkedinUrl: string;

  @IsNotEmpty()
  @ApiProperty()
  facebookUrl: string;

  @ApiProperty()
  isNew?: boolean;
}
