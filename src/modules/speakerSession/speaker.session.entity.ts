import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Session } from '../session/session.entity';
import { Speaker } from '../speaker/speaker.entity';
@Entity()
export class SpeakerSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // relationships
  @ManyToOne(
    () => Session,
    session => session.speakerSessions,
  )
  public session!: Session;

  @ManyToOne(
    () => Speaker,
    speaker => speaker.speakerSessions,
  )
  public speaker!: Speaker;
}
