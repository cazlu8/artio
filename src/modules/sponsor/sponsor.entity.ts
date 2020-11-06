import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SponsorTier } from './enums/sponsor.tier.enum';
import { Event } from '../event/event.entity';

@Entity()
export class Sponsor {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { nullable: false, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 60, nullable: false, name: 'name' })
  name?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: false, name: 'banner' })
  banner?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'logo' })
  logo?: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    unique: true,
    name: 'email',
  })
  email: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'external_link' })
  externalLink?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'phone_number' })
  phoneNumber?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'address' })
  address?: string;

  @ApiProperty()
  @Column('enum', { enum: SponsorTier, nullable: false, default: undefined })
  tier?: SponsorTier;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'description' })
  description?: string;

  @ApiProperty()
  @Column('boolean', {
    default: false,
    nullable: true,
    name: 'in_show_room',
  })
  inShowRoom?: boolean;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'media_url' })
  mediaUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'youtube_url' })
  youtubeUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'youtube_live_url' })
  youtubeLiveUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'url_360' })
  url360?: string;

  @ApiProperty()
  @Column('varchar', { length: 60, nullable: true, name: 'text_url360' })
  textUrl360?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'btn_link' })
  btnLink?: string;

  @ApiProperty()
  @Column('varchar', { length: 30, nullable: true, name: 'btn_label' })
  btnLabel?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Event)
  @JoinTable()
  events: Event[];
}
