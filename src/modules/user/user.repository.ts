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
    return this.createQueryBuilder('events')
      .select(attributes)
      .distinct()
      .leftJoin('user_events', 'user_events', `${id} = user_events.userId`)
      .leftJoin(
        'event',
        'event',
        'user_events.eventId = event.id and user_events.redeemed = true',
      )
      .getRawMany()
      .then(rows =>
        rows.map(r => {
          return r.id === null ? null : r;
        }),
      );
  }

  removeAvatarUrl(id: any) {
    return this.createQueryBuilder()
      .update(User)
      .set({ avatarImgUrl: null })
      .where(`id = ${id}`)
      .execute();
  }

  preSaveUser(user: Partial<User>) {
    return this.createQueryBuilder()
      .insert()
      .values(user)
      .execute();
  }
}
