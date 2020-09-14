import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @IsOptional()
  @ApiProperty({ type: 'number' })
  id?: number;

  @ApiProperty()
  @IsNotEmpty()
  banner: string;
}
