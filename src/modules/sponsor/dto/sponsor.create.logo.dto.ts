import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLogoDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  logo: string;
}
