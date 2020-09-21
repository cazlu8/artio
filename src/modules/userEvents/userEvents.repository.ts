import {
  EntityRepository,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from 'typeorm';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { UserEvents } from './userEvents.entity';
import { RedeemEventCodeDTO } from './dto/userEvents.redeemEventCode.dto';
import { ListUserEventDto } from './dto/userEvents.list.dto';

@EntityRepository(UserEvents)
export class UserEventsRepository extends Repository<UserEvents> {
  async get(options: FindOneOptions<UserEvents>) {
    return this.findOne(options);
  }

  checkCode(redeemEventCodeDTO: RedeemEventCodeDTO): Promise<ObjectLiteral> {
    const { userId, ticketCode } = redeemEventCodeDTO;
    return this.createQueryBuilder('userEvents')
      .select('userEvents.userId')
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .getRawOne();
  }

  redeemEventCode(userId, ticketCode): Promise<UpdateResult> {
    return this.createQueryBuilder()
      .update()
      .set({ redeemed: true })
      .where(`"ticketCode" = '${ticketCode}' and "userId" = ${userId}`)
      .execute();
  }

  getUserEmailsBindedToEventByEmail(
    emails: string[],
    eventId: number,
  ): Promise<ObjectLiteral[]> {
    return this.createQueryBuilder('userEvents')
      .select('user.email')
      .innerJoin('userEvents.user', 'user')
      .where('userEvents.eventId = :eventId', { eventId })
      .andWhere('user.email in (:...emails)', { emails })
      .getRawMany();
  }

  getUserGuidsByUserIds(
    userIds: number[],
    eventId: number,
  ): Promise<ObjectLiteral[]> {
    return this.createQueryBuilder('userEvents')
      .select('user.guid')
      .innerJoin('userEvents.user', 'user')
      .where('userEvents.eventId = :eventId', { eventId })
      .andWhere('userEvents.redeemed = true')
      .andWhere('user.id in (:...userIds)', { userIds })
      .getRawMany();
  }

  getEventsFromUser(userId: number): Promise<ListUserEventDto[]> {
    return this.createQueryBuilder(`userEvents`)
      .select(`event.id`, `id`)
      .addSelect(`name`, `name`)
      .innerJoin(`userEvents.event`, `event`)
      .where(`userEvents.userId = :userId`, { userId })
      .getRawMany();
  }

  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }
}
