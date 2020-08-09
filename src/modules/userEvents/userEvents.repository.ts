import { EntityRepository, Repository } from 'typeorm';
import { UserEvents } from './userEvents.entity';
import { RedeemEventCodeDTO } from './dto/userEvents.redeemEventCode.dto';

@EntityRepository(UserEvents)
export class UserEventsRepository extends Repository<UserEvents> {
  checkCode(redeemEventCodeDTO: RedeemEventCodeDTO) {
    const { userId, ticketCode } = redeemEventCodeDTO;
    const attributes = ['eventId'];
    return this.createQueryBuilder()
      .select(attributes)
      .leftJoin('user', 'user', `${userId} = user_events.userId`)
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .getRawOne();
  }

  redeemEventCode(eventId) {
    const { user_events_eventId } = eventId;
    return this.createQueryBuilder()
      .update()
      .set({ redeemed: true })
      .where(`"eventId" = ${user_events_eventId}`)
      .execute();
  }

  bindUserToEvent(userEvent: Partial<UserEvents>) {
    return this.createQueryBuilder()
      .insert()
      .values(userEvent)
      .execute();
  }

  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }
}
