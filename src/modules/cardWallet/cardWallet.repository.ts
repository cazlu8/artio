import { EntityRepository, Repository } from 'typeorm';
import { CardWallet } from './cardWallet.entity';
import { ListUserEventDto } from '../userEvents/dto/userEvents.list.dto';

@EntityRepository(CardWallet)
export class CardWalletRepository extends Repository<CardWallet> {
  getCardsFromUser(userId: number, userName?: string, eventId?: number) {
    let query = this.createQueryBuilder('cardWallet')
      .select('user.id', 'id')
      .addSelect('email', 'email')
      .addSelect('cardWallet.id', 'cardWalletId')
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
        "lower(concat(user.firstName,' ', user.lastName)) like :name",
        { name: `%${userName.toLowerCase()}%` },
      );
    if (eventId)
      query = query.andWhere('cardWallet.eventId = :eventId', { eventId });
    return query.getRawMany();
  }

  getEventsFromUser(userId: number): Promise<ListUserEventDto[]> {
    return this.createQueryBuilder(`cardWallet`)
      .select(`event.id`, `id`)
      .addSelect(`event.name`, `name`)
      .innerJoin(`cardWallet.event`, `event`)
      .where(`cardWallet.requestingUserId = :userId`, { userId })
      .distinctOn(['event.id'])
      .getRawMany();
  }

  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }
}
