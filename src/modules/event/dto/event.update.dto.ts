import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export default class UpdateEventDTO {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsOptional()
  heroImgUrl?: string;

  @ApiProperty()
  @IsOptional()
  locationName?: string;

  @ApiProperty()
  @IsOptional()
  streetName?: string;

  @ApiProperty()
  @IsOptional()
  streetNumber?: string;

  @ApiProperty()
  @IsOptional()
  stateAcronym?: string;

  @ApiProperty()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsOptional()
  zipCode?: string;

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  additionalInfo?: string;

  @ApiProperty()
  @IsOptional()
  locationLongitude?: number;

  @ApiProperty()
  @IsOptional()
  locationLatitude?: number;

  @ApiProperty()
  @IsOptional()
  startDate?: Date;

  @ApiProperty()
  @IsOptional()
  endDate?: Date;

  @ApiProperty()
  @IsNotEmpty()
  timezone?: string;

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
