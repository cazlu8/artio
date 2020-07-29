import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'number' })
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  banner: string;
}
