import { EntityRepository, Repository } from 'typeorm';
import { CardWallet } from './cardWallet.entity';

@EntityRepository(CardWallet)
export class CardWalletRepository extends Repository<CardWallet> {
  getCardsFromUser(userId: number, userName?: string, eventId?: number) {
    let query = this.createQueryBuilder('cardWallet')
      .select('user.id', 'id')
      .addSelect('email', 'email')
      .addSelect('bio', 'bio')
      .addSelect('company', 'company')
      .addSelect('current_position', 'currentPosition')
      .addSelect('phone_number', 'phoneNumber')
      .addSelect('social_urls', 'socialUrls')
      .addSelect('avatar_img_url', 'avatarImgUrl')
      .addSelect('first_name', 'firstName')
      .addSelect('last_name', 'lastName')
      .innerJoin('cardWallet.requestedUser', 'user')
      .where('cardWallet.requestingUserId = :userId', { userId });
    if (userName)
      query = query.andWhere(
        "concat(user.firstName,' ', user.lastName) like :name",
        { name: `%${userName}%` },
      );
    if (eventId)
      query = query.andWhere('cardWallet.eventId = :eventId', { eventId });
    return query.getRawMany();
  }
}
