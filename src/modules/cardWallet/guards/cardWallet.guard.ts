import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRepository } from '../../user/user.repository';
import { CardWalletRepository } from '../cardWallet.repository';

@Injectable()
export class CardWalletGuard implements CanActivate {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly repository: CardWalletRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return await this.validateRequest(request);
  }

  async validateRequest(request: any) {
    if (process.env.NODE_ENV === 'production') {
      const {
        user: { sub },
      } = request.raw;
      const userIds = await this.userRepository.getUserIdByGuid([sub]);
      return await this.repository.exists({
        id: request.params.id,
        requestingUserId: userIds[0].id,
      });
    }
    return true;
  }
}
