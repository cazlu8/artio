import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EventStages } from '../eventStages/eventStages.entity';
import { EventStageScheduleSpeaker } from '../eventStageScheduleSpeaker/eventStageScheduleSpeaker.entity';

@Entity()
export class EventStageSchedule {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('varchar', { length: 255, name: 'title' })
  title: string;

  @ApiProperty()
  @Column('varchar', { length: 1200, name: 'description' })
  description: string;

  @ApiProperty()
  @Column('timestamptz', { nullable: false, name: 'start_date' })
  startDate: Date;

  @ApiProperty()
  @Column('timestamptz', { nullable: false, name: 'end_date' })
  endDate: Date;

  @ApiProperty()
  @Column('int', { name: 'eventStageId' })
  eventStageId: number;

  @ManyToOne(() => EventStages)
  @JoinColumn()
  eventStage: EventStages;
}
