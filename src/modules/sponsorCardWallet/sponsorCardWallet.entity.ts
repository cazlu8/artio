import {
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../event/event.entity';
import { User } from '../user/user.entity';
import { Sponsor } from '../sponsor/sponsor.entity';

@Entity()
export class SponsorCardWallet {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'sponsorId', unique: true })
  sponsorId: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'userId', unique: true })
  userId: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'eventId', unique: true })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => Sponsor)
  @JoinColumn()
  sponsor: Sponsor;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
