import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Event {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { nullable: false, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'name' })
  name: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'hero_img_url' })
  heroImgUrl: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'location_name' })
  locationName: string;

  @ApiProperty()
  @Column('varchar', { length: 200, nullable: true, name: 'street_name' })
  streetName: string;

  @ApiProperty()
  @Column('varchar', { length: 6, nullable: true, name: 'street_number' })
  streetNumber: string;

  @ApiProperty()
  @Column('varchar', { length: 2, nullable: true, name: 'state_acronym' })
  stateAcronym: string;

  @ApiProperty()
  @Column('varchar', { length: 30, nullable: true, name: 'state' })
  state: string;

  @ApiProperty()
  @Column('varchar', { length: 30, nullable: true, name: 'country' })
  country: string;

  @ApiProperty()
  @Column('varchar', { length: 50, nullable: true, name: 'city' })
  city: string;

  @ApiProperty()
  @Column('varchar', { length: 12, nullable: true, name: 'zip_code' })
  zipCode: string;

  @ApiProperty()
  @Column('varchar', {
    length: 20000,
    nullable: true,
    name: 'description',
  })
  description: string;

  @ApiProperty()
  @Column('varchar', {
    length: 1000,
    nullable: true,
    name: 'additional_info',
  })
  additionalInfo: string;

  @ApiProperty()
  @Column('float', { nullable: true, name: 'location_latitude' })
  locationLatitude: number;

  @ApiProperty()
  @Column('float', { nullable: true, name: 'location_longitude' })
  locationLongitude: number;

  @ApiProperty()
  @Index('event_start_date_idx')
  @Column('timestamptz', { nullable: false, name: 'start_date' })
  startDate: Date;

  @ApiProperty()
  @Column('timestamptz', { nullable: false, name: 'end_date' })
  endDate: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'liveUrl' })
  liveUrl: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'streamKey' })
  streamKey: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'streamUrl' })
  streamUrl: string;

  @ApiProperty()
  @Column('boolean', { default: false, name: 'onLive' })
  onLive?: boolean;
}
