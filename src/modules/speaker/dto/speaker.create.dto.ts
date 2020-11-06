import { IsEmail, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpeakerCreateDTO {
  @ApiProperty()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @ApiProperty()
  @IsNotEmpty()
  bio: string;

  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  socialUrls: string;
}
