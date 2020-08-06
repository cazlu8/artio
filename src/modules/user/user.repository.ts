import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserEvents } from '../userEvents/userEvents.entity';

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

  checkCode(redeemEventCodeDTO) {
    const { userId, ticketCode } = redeemEventCodeDTO;
    const attributes = ['user_events.eventId'];
    return this.createQueryBuilder('user')
      .select(attributes)
      .leftJoin('user_events', 'user_events', `${userId} = user_events.userId`)
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .getRawOne();
  }

  redeemEventCode(eventId) {
    const { user_events_eventId } = eventId;
    return this.createQueryBuilder()
      .update(UserEvents)
      .set({ redeemed: true })
      .where(`"eventId" = ${user_events_eventId}`)
      .execute();
  }
}
