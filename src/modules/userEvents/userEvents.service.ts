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
    usersId: number[],
    eventId: number,
    ticketCode: string,
  ) {
    return await this.repository.bindUsersToEvent(usersId, eventId, ticketCode);
  }
}
