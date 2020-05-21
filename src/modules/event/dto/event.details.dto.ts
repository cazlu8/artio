import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EventDetailsDTO {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  // current day of week from the event
  @ApiProperty()
  @IsNotEmpty()
  day?: string;

  @IsNotEmpty()
  @ApiProperty()
  locationName: string;

  // formatting (streetNumber, streetName, city, stateAcronym, zipCode)
  @ApiProperty()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  additionalInfo: string;
}
