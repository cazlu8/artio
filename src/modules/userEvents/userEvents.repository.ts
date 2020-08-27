import { EntityRepository, Repository } from 'typeorm';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { UserEvents } from './userEvents.entity';
import { RedeemEventCodeDTO } from './dto/userEvents.redeemEventCode.dto';

@EntityRepository(UserEvents)
export class UserEventsRepository extends Repository<UserEvents> {
  async get(options: FindOneOptions<UserEvents>) {
    return this.findOne(options);
  }

  checkCode(redeemEventCodeDTO: RedeemEventCodeDTO) {
    const { userId, ticketCode } = redeemEventCodeDTO;
    return this.createQueryBuilder('userEvents')
      .select('userEvents.userId')
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .getRawOne();
  }

  redeemEventCode(userId, ticketCode) {
    return this.createQueryBuilder()
      .update()
      .set({ redeemed: true })
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .execute();
  }

  bindUserToEvent(userEvents: Partial<UserEvents>[]) {
    return this.createQueryBuilder()
      .insert()
      .values(userEvents)
      .execute();
  }

  getUserEmailsBindedToEventByEmail(emails: string[], eventId: number) {
    return this.createQueryBuilder('userEvents')
      .select('user.email')
      .innerJoin('userEvents.user', 'user')
      .where('userEvents.eventId = :eventId', { eventId })
      .andWhere('user.email in (:...emails)', { emails })
      .getRawMany();
  }

  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }
}
