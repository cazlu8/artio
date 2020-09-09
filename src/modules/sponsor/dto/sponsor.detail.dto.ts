import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SponsorDetail {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  banner: string;

  @ApiProperty()
  @IsNotEmpty()
  tier: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  description: string;
}
