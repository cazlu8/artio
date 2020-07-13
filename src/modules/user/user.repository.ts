import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }

  async get({ where, select }) {
    return this.findOne({ select, where });
  }

  getEventsByUserId(id: number) {
    const attributes = ['event.*'];
    return this.createQueryBuilder('user')
      .select(attributes)
      .distinct()
      .leftJoin('user_events', 'user_events', `${id} = user_events.userId`)
      .leftJoin('event', 'event', 'user_events.eventId = event.id')
      .getRawMany()
      .then(rows => (rows[0].id === null ? [] : rows));
  }

  getUserEventsByRole(userId: number, roleId: number) {
    const attributes = ['*'];
    return this.createQueryBuilder('events')
      .select(attributes)
      .where(
        `id IN (select "userEventsEventId" from user_events_roles where "userEventsUserId" = ${userId} and "roleId" = ${roleId});`,
      )
      .getRawMany();
  }
}
