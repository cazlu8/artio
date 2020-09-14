import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SponsorTier } from '../enums/sponsor.tier.enum';

export class CreateSponsorDto {
  @ApiProperty()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty()
  @IsNotEmpty()
  name?: string;

  @IsUrl()
  @ApiProperty()
  @IsNotEmpty()
  banner?: string;

  @IsUrl()
  @ApiProperty()
  @IsOptional()
  logo?: string;

  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  externalLink?: string;

  @IsNotEmpty()
  @IsEnum(SponsorTier)
  @ApiProperty()
  tier?: SponsorTier;

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  inShowRoom?: boolean;

  @IsUrl()
  @IsOptional()
  @ApiProperty()
  mediaUrl?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty()
  url360?: string;

  @IsUrl()
  @ApiProperty()
  @IsOptional()
  btnLink?: string;

  @ApiProperty()
  @IsOptional()
  btnLabel?: string;
}
