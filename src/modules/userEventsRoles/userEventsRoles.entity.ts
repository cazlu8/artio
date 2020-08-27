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

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'userEventsUserId', primary: true })
  userEventsUserId: number;

  @ApiProperty()
  @PrimaryColumn({ type: 'int', name: 'userEventsEventId', primary: true })
  userEventsEventId: number;

  @OneToOne(() => Role)
  @JoinColumn()
  role: Role;

  @OneToOne(() => UserEvents)
  @JoinColumn()
  userEvents: UserEvents;
}
