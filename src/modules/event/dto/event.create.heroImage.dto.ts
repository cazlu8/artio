import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHeroImage {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  heroImageUrl: string;
}
