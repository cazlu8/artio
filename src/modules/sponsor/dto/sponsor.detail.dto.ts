import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SponsorTier } from '../enums/sponsor.tier.enum';

export class SponsorDetail {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  banner: string;

  @IsNotEmpty()
  @IsEnum(SponsorTier)
  @ApiProperty()
  tier?: SponsorTier;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  description: string;
}
