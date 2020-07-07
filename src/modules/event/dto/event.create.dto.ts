import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export default class CreateEventDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsOptional()
  heroImgUrl?: string;

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
  @IsOptional()
  locationLongitude?: number;

  @ApiProperty()
  @IsOptional()
  locationLatitude?: number;

  @ApiProperty()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty()
  @IsOptional()
  liveUrl?: string;

  @ApiProperty()
  @IsOptional()
  streamKey?: string;

  @ApiProperty()
  @IsOptional()
  streamUrl?: string;

  @ApiProperty()
  @IsOptional()
  onLive?: boolean;
}
