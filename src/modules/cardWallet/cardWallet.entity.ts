import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
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
  @PrimaryColumn({ type: 'int', name: 'requestingUserId', primary: true })
  requestingUserId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'requestedUserId', primary: true })
  requestedUserId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventId', primary: true })
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