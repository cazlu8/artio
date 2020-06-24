import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  // OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
// import { SpeakerSession } from '../speakerSession/speaker.session.entity';

@Entity()
export class Speaker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { nullable: false, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'avatar_img' })
  avatarImg: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'first_name' })
  firstName: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'last_name' })
  lastName: string;

  @ApiProperty()
  @Column('varchar', { length: 10000, nullable: false, name: 'bio' })
  bio: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    unique: true,
  })
  email: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // relationships
  // @ApiProperty()
  // @OneToMany(
  //   () => SpeakerSession,
  //   speakerSession => speakerSession.speaker,
  // )
  // public speakerSessions!: SpeakerSession[];
}
