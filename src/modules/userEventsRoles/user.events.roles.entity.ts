import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role/role.entity';
import { UserEvents } from '../userEvents/userEvents.entity';

@Entity()
export class UserEventsRoles {
  @ApiProperty()
  @PrimaryColumn({
    type: 'int',
    name: 'userEventsId',
    primary: true,
  })
  userEventsId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'roleId', primary: true })
  roleId: number;

  @OneToOne(() => Role)
  @JoinColumn()
  role: Role;

  @OneToOne(() => UserEvents)
  @JoinColumn()
  userEvents: UserEvents;
}
