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

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'ticketCode' })
  ticketCode?: string;

  @ApiProperty()
  @Column('boolean', { default: false, name: 'redeemed' })
  redeemed?: boolean;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
