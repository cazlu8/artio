import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Speaker {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('varchar', { length: 60, name: 'name' })
  name: string;

  @ApiProperty()
  @Column('varchar', { length: 1200, name: 'bio' })
  bio: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    unique: true,
    name: 'email',
  })
  email: string;

  @ApiProperty()
  @Column('json', {
    nullable: true,
    name: 'social_urls',
    default: new Array(0),
  })
  socialUrls?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
