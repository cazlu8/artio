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

@Entity()
export class CardWallet {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'requestingUserId', unique: true })
  requestingUserId: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'requestedUserId', unique: true })
  requestedUserId: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'eventId', unique: true })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => User)
  @JoinColumn()
  requestingUser: User;

  @OneToOne(() => User)
  @JoinColumn()
  requestedUser: User;
}
