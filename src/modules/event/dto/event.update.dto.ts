import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class UpdateEventDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  heroImgUrl: string;

  @IsNotEmpty()
  @ApiProperty()
  locationName: string;

  @ApiProperty()
  @IsNotEmpty()
  streetName: string;

  @ApiProperty()
  @IsNotEmpty()
  streetNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  stateAcronym: string;

  @ApiProperty()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  additionalInfo: string;

  @ApiProperty()
  @IsNotEmpty()
  locationLongitude: number;

  @ApiProperty()
  @IsNotEmpty()
  locationLatitude: number;

  @ApiProperty()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  liveUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  onLive: boolean;
}
