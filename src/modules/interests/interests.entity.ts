import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryInterests } from '../categoryInterests/categoryInterests.entity';

@Entity()
export class Interests {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('varchar', { length: 255, name: 'name' })
  name: string;

  @ApiProperty()
  @Column('int', { name: 'categoryId' })
  categoryId: number;

  @ManyToOne(() => CategoryInterests)
  @JoinColumn()
  category: CategoryInterests;
}
