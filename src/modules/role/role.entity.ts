import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from './enums/roles.enum';
import { UserEvents } from '../userEvents/userEvents.entity';

@Entity()
export class Role {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('enum', { enum: Roles, nullable: true, default: 1 })
  name?: Roles;

  @ManyToMany(() => UserEvents)
  @JoinTable()
  userEvents: UserEvents[];
}
