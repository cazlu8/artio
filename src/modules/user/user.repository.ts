import { EntityRepository, In, Repository } from 'typeorm';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  get({ where, select }) {
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

  preSaveUser(users: Partial<User>[]) {
    return this.createQueryBuilder()
      .insert()
      .values(users)
      .onConflict(`("email") DO NOTHING`)
      .execute();
  }

  getUserIdByGuid(guids: string[]) {
    return this.find({
      select: ['id'],
      where: { guid: In(guids) },
    });
  }

  getCardDataByGuid(userGuid: string): Promise<Partial<User>> {
    return this.findOne({
      select: [
        'id',
        'firstName',
        'lastName',
        'avatarImgUrl',
        'company',
        'currentPosition',
        'bio',
        'phoneNumber',
        'email',
        'socialUrls',
      ],
      where: { guid: userGuid },
    });
  }
}
