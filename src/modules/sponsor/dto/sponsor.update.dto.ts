import { IsEmail, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SponsorTier } from '../enums/sponsor.tier.enum';

export class UpdateSponsorDto {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @IsUrl()
  @ApiProperty()
  @IsOptional()
  banner?: string;

  @IsUrl()
  @ApiProperty()
  @IsOptional()
  logo?: string;

  @IsEmail()
  @ApiProperty()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsOptional()
  externalLink?: string;

  @IsOptional()
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

  @ApiProperty()
  @IsOptional()
  btnLink?: string;

  @ApiProperty()
  @IsOptional()
  btnLabel?: string;
}
