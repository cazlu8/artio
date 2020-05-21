import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../event/event.entity';
import { SpeakerSession } from '../speakerSession/speaker.session.entity';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { nullable: false, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'name' })
  name: string;

  @ApiProperty()
  @Column('varchar', { length: 1000, nullable: false, name: 'content' })
  content: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'place_name' })
  placeName: string;

  @ApiProperty()
  @Column('timestamptz', { nullable: false, name: 'session_date' })
  sessionDate: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // relationships
  @ApiProperty()
  @ManyToOne(
    () => Event,
    (event: Event) => event.sessions,
  )
  event: Event;

  @ApiProperty()
  @OneToMany(
    () => SpeakerSession,
    speakerSession => speakerSession.session,
  )
  public speakerSessions!: SpeakerSession[];
}
