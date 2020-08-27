import { EntityRepository, Repository } from 'typeorm';
import { UserEventsRoles } from './userEventsRoles.entity';
@EntityRepository(UserEventsRoles)
export class UserEventsRolesRepository extends Repository<UserEventsRoles> {}
