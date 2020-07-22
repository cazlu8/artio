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
export class UserEvents {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'userId', primary: true })
  userId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventId', primary: true })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
