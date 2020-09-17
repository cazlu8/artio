import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLogoDto {
  @IsOptional()
  @ApiProperty({ type: 'number' })
  id?: number;

  @ApiProperty()
  @IsNotEmpty()
  logo: string;
}
