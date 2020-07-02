import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';

@Entity()
export class UserRoles {
  @ApiProperty()
  @PrimaryColumn({ type: 'int', unique: false, name: 'userId', primary: true })
  userId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', unique: false, name: 'roleId', primary: true })
  roleId: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToOne(() => Role)
  @JoinColumn()
  role: Role;
}
