import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../event/event.entity';
import { Sponsor } from '../sponsor/sponsor.entity';

@Entity()
export class EventSponsors {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'sponsorId' })
  sponsorId: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'eventId' })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => Sponsor)
  @JoinColumn()
  sponsor: Sponsor;
}
