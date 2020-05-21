import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Session } from '../session/session.entity';

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
  @Column('varchar', { length: 255, nullable: false, name: 'hero_img_url' })
  heroImgUrl: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'location_name' })
  locationName: string;

  @ApiProperty()
  @Column('varchar', { length: 200, nullable: false, name: 'street_name' })
  streetName: string;

  @ApiProperty()
  @Column('varchar', { length: 6, nullable: false, name: 'street_number' })
  streetNumber: string;

  @ApiProperty()
  @Column('varchar', { length: 2, nullable: false, name: 'state_acronym' })
  stateAcronym: string;

  @ApiProperty()
  @Column('varchar', { length: 30, nullable: false, name: 'state' })
  state: string;

  @ApiProperty()
  @Column('varchar', { length: 30, nullable: false, name: 'country' })
  country: string;

  @ApiProperty()
  @Column('varchar', { length: 50, nullable: false, name: 'city' })
  city: string;

  @ApiProperty()
  @Column('varchar', { length: 12, nullable: false, name: 'zip_code' })
  zipCode: string;

  @ApiProperty()
  @Column('varchar', {
    length: 20000,
    nullable: false,
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
  @Column('float', { nullable: false, name: 'location_latitude' })
  locationLatitude: number;

  @ApiProperty()
  @Column('float', { nullable: false, name: 'location_longitude' })
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

  // relationships
  @OneToMany(
    () => Session,
    (sessionEvent: Session) => sessionEvent.event,
    { cascade: true },
  )
  sessions: Session[];
}
