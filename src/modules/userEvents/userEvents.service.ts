import { Injectable } from '@nestjs/common';
import { UserEventsRepository } from './userEvents.repository';
import { RedeemEventCodeDTO } from './dto/userEvents.redeemEventCode.dto';

@Injectable()
export class UserEventsService {
  constructor(private readonly repository: UserEventsRepository) {}

  async checkCode(redeemEventCodeDTO: RedeemEventCodeDTO) {
    return await this.repository.checkCode(redeemEventCodeDTO);
  }

  async redeemEventCode(eventId: number) {
    return await this.repository.redeemEventCode(eventId);
  }

  async bindUsersToEvent(
    userIds: number[],
    eventId: number,
    ticketCode: string,
  ) {
    const existsFn = userId => this.repository.exists({ userId, eventId });
    const bindUserFn = userId =>
      this.repository.bindUserToEvent({ userId, eventId, ticketCode });
    const bindUsersToEventFns = userIds.map(userId =>
      existsFn(userId).then(async exists =>
        exists ? Promise.resolve() : await bindUserFn(userId),
      ),
    );
    await Promise.all(bindUsersToEventFns);
  }
}
