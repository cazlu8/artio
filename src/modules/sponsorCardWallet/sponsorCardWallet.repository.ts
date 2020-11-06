import { EntityRepository, Repository } from 'typeorm';
import { ListUserEventDto } from '../userEvents/dto/userEvents.list.dto';
import { SponsorCardWallet } from './sponsorCardWallet.entity';

@EntityRepository(SponsorCardWallet)
export class SponsorCardWalletRepository extends Repository<SponsorCardWallet> {
  getCardsFromSponsor(sponsorId: number, userName?: string, eventId?: number) {
    let query = this.createQueryBuilder('sponsorCardWallet')
      .select('user.id', 'id')
      .addSelect('email', 'email')
      .addSelect('contact_email', 'contactEmail')
      .addSelect('sponsorCardWallet.id', 'sponsorCardWalletId')
      .addSelect('bio', 'bio')
      .addSelect('company', 'company')
      .addSelect('current_position', 'currentPosition')
      .addSelect('phone_number', 'phoneNumber')
      .addSelect('social_urls', 'socialUrls')
      .addSelect('avatar_img_url', 'avatarImgUrl')
      .addSelect('first_name', 'firstName')
      .addSelect('last_name', 'lastName')
      .innerJoin('cardWallet.requestedUser', 'user')
      .where('sponsorCardWallet.sponsorId = :sponsorId', { sponsorId });
    if (userName)
      query = query.andWhere(
        "lower(concat(user.firstName,' ', user.lastName)) like :name",
        { name: `%${userName.toLowerCase()}%` },
      );
    if (eventId)
      query = query.andWhere('sponsorCardWallet.eventId = :eventId', {
        eventId,
      });
    return query.getRawMany();
  }

  getEventsFromSponsor(sponsorId: number): Promise<ListUserEventDto[]> {
    return this.createQueryBuilder(`sponsorCardWallet`)
      .select(`event.id`, `id`)
      .addSelect(`event.name`, `name`)
      .innerJoin(`sponsorCardWallet.event`, `event`)
      .where(`sponsorCardWallet.sponsorId = :sponsorId`, { sponsorId })
      .distinctOn(['event.id'])
      .getRawMany();
  }

  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }
}
