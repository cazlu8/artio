import { EntityRepository, Repository } from 'typeorm';
import { CardWallet } from './cardWallet.entity';

@EntityRepository(CardWallet)
export class CardWalletRepository extends Repository<CardWallet> {
  getCardsFromUser(userId: number, userName?: string, eventId?: number) {
    let query = this.createQueryBuilder('cardWallet')
      .select([
        'user.id',
        'user.avatarImgUrl',
        'user.company',
        'user.currentPosition',
        'user.bio',
        'user.phoneNumber',
        'user.email',
        'user.socialUrls',
      ])
      .addSelect('concat(user.firstName," ", user.lastName)', 'name')
      .innerJoin('cardWallet.user', 'user')
      .where('requestingUserId = :userId', { userId });
    if (userName)
      query = query.andWhere('name like :name', { name: `%${userName}%` });
    if (eventId) query = query.andWhere('eventId = :eventId', { eventId });
    return query.getRawMany();
  }
}
