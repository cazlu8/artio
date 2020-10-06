import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../event/event.entity';
import { EventStages } from '../eventStages/eventStages.entity';

@Entity()
export class EventStageSchedule {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('varchar', { length: 255, name: 'title' })
  title: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'start_date' })
  startDate: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'end_date' })
  endDate: Date;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventStageId' })
  eventStageId: number;

  @ManyToOne(() => EventStages)
  @JoinColumn()
  eventStage: EventStages;
}
