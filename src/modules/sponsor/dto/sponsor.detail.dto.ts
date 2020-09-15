import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SponsorTier } from '../enums/sponsor.tier.enum';

export class SponsorDetail {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  banner: string;

  @ApiProperty()
  @IsOptional()
  externalLink?: string;

  @IsNotEmpty()
  @IsEnum(SponsorTier)
  @ApiProperty()
  tier: SponsorTier;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  logo?: string;

  @ApiProperty()
  @IsNotEmpty()
  inShowRoom: string;

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty()
  @IsOptional()
  address?: string;
}
