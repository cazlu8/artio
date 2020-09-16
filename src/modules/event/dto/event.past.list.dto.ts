import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EventPastListDto {
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @ApiProperty()
  heroImgUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  timezone: string;
}
