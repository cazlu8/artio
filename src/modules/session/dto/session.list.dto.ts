import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export default class SessionListDTO {
  @Expose({ name: 'name' })
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  // formatting ("DAY " positionDay-DAYOFWEEK )
  @Expose({ name: 'dayTitle' })
  @ApiProperty()
  @IsNotEmpty()
  dayTitle: string;

  // formatting (hour:mm)
  @Expose({ name: 'startTime' })
  @ApiProperty()
  @IsNotEmpty()
  startTime: string;

  @Expose({ name: 'placeName' })
  @IsNotEmpty()
  @ApiProperty()
  placeName: string;
}
