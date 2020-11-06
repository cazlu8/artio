import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Speaker } from '../speaker/speaker.entity';
import { EventStageSchedule } from '../eventStageSchedule/eventStageSchedule.entity';

@Entity()
export class EventStageScheduleSpeaker {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('int', { name: 'speakerId' })
  speakerId: number;

  @ApiProperty()
  @Column('int', { name: 'scheduleId' })
  scheduleId: number;

  @ManyToOne(() => Speaker)
  @JoinColumn()
  speaker: Speaker;

  @ManyToOne(() => EventStageSchedule)
  @JoinColumn()
  schedule: EventStageSchedule;
}
