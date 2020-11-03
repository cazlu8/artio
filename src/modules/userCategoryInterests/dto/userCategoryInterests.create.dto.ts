import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class UserCategoryInterestsCreateDTO {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNumber()
  categoryId: number;
}
