import { Injectable } from '@nestjs/common';
import { CardWalletRepository } from './cardWallet.repository';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class CardWalletService {
  constructor(
    private readonly repository: CardWalletRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getUserIds(requestingUserGuid: string, requestedUserGuid: string) {
    const getRequestingUserId = this.userRepository.getUserIdByGuid([
      requestingUserGuid,
    ]);
    const getRequestedUserId = this.userRepository.getUserIdByGuid([
      requestedUserGuid,
    ]);
    return (await Promise.all([getRequestingUserId, getRequestedUserId]))
      .flat()
      .map(({ id }) => id);
  }

  async verifyIfRelationshipExists(
    eventId: number,
    requestingUserGuid: string,
    requestedUserGuid: string,
  ) {
    const [requestingUserId, requestedUserId] = await this.getUserIds(
      requestingUserGuid,
      requestedUserGuid,
    );
    return (
      (await this.repository.count({
        where: { eventId, requestingUserId, requestedUserId },
      })) > 0
    );
  }
}
