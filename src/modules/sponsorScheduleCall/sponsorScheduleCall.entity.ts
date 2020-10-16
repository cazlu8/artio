import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Sponsor } from '../sponsor/sponsor.entity';

@Entity()
export class SponsorScheduleCall {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('boolean', { default: false, name: 'reserved' })
  reserved: boolean;

  @ApiProperty()
  @Column('timestamptz', { nullable: false, name: 'end_date' })
  time: Date;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'sponsorId' })
  sponsorId: number;

  @ManyToOne(() => Sponsor)
  @JoinColumn()
  sponsor: Sponsor;
}
