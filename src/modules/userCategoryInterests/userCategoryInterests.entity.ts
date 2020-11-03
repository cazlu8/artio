import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryInterests } from '../categoryInterests/categoryInterests.entity';
import { User } from '../user/user.entity';

@Entity()
export class UserCategoryInterests {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('int', { name: 'categoryId' })
  categoryId: number;

  @ApiProperty()
  @Column('int', { name: 'userId' })
  userId: number;

  @ManyToOne(() => CategoryInterests)
  @JoinColumn()
  category: CategoryInterests;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
