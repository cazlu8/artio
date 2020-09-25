import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../event/event.entity';

@Entity()
export class EventStages {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'name' })
  name: string;

  @ApiProperty()
  @Column('varchar', { length: 12, nullable: true, name: 'region' })
  region: string;

  @ApiProperty()
  @Column('varchar', {
    length: 15,
    nullable: true,
    name: 'cdn_distribution_id',
  })
  cdnDistributionId: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'liveUrl' })
  liveUrl: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'streamKey' })
  streamKey: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'streamUrl' })
  streamUrl: string;

  @ApiProperty()
  @Column('boolean', { default: false, name: 'onLive' })
  onLive?: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventId', primary: true })
  eventId: number;

  @OneToOne(() => Event)
  @JoinColumn()
  event: Event;
}
