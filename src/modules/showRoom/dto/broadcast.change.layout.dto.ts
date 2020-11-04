import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class ChangeBroadcastLayoutDTO {
  @ApiProperty()
  @IsNotEmpty()
  type?: string;

  @ApiProperty()
  @IsNotEmpty()
  layout?: any;
}
