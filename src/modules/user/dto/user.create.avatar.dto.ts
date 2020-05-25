import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvatarDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string' })
  guid: string;

  @ApiProperty()
  @IsNotEmpty()
  avatarImgUrl: string;
}
