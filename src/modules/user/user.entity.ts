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
  @Column('boolean', { default: true, name: 'is_new' })
  isNew?: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
