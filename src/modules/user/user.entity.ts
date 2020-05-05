import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: false, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'first_name' })
  firstName?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'last_name' })
  lastName?: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    unique: true,
  })
  email: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'avatar_img' })
  avatarImg?: string;

  @ApiProperty()
  @Column('varchar', { length: 2000, nullable: true, name: 'bio' })
  bio?: string;

  @ApiProperty()
  @Column('varchar', {
    length: 50,
    unique: true,
    nullable: true,
    name: 'phone_number',
  })
  phoneNumber?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'twitter_url' })
  twitterUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'instagram_url' })
  instagramUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'linkedin_url' })
  linkedinUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'facebook_url' })
  facebookUrl?: string;

  @ApiProperty()
  @Column('boolean', { default: true, name: 'is_new' })
  isNew?: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
