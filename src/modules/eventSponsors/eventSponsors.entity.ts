import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
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
  @PrimaryColumn({ type: 'int', name: 'sponsorId', primary: true })
  sponsorId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventId', primary: true })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => Sponsor)
  @JoinColumn()
  sponsor: Sponsor;
}
