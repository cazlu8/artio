import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { Sponsor } from '../sponsor/sponsor.entity';

@Entity()
export class SponsorUsers {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'userId', primary: true })
  userId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'sponsorId', primary: true })
  sponsorId: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToOne(() => Sponsor)
  @JoinColumn()
  sponsor: Sponsor;
}
