import {
  Entity,
  PrimaryColumn,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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
  @Column('int', { name: 'media_live_channel_id' })
  mediaLiveChannelId: number;

  @ApiProperty()
  @Column('int', { name: 'media_live_input_id' })
  mediaLiveInputId: number;

  @ApiProperty()
  @Column('varchar', {
    length: 15,
    nullable: true,
    name: 'cdn_distribution_id',
  })
  cdnDistributionId: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'live_url' })
  liveUrl: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'stream_key' })
  streamKey: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'stream_url' })
  streamUrl: string;

  @ApiProperty()
  @Column('boolean', { default: false, name: 'on_live' })
  onLive?: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'eventId' })
  eventId: number;

  @ManyToOne(() => Event)
  @JoinColumn()
  event: Event;
}
