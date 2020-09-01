import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRepository } from '../../modules/user/user.repository';

@Injectable()
export class VerifyIfIsAuthenticatedUserGuard implements CanActivate {
  constructor(private userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return await this.validateRequest(request);
  }

  async validateRequest(request: any) {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    const { sub: authenticatedUserGuid, id: userId, guid: userGuid } = {
      ...request.raw?.user,
      ...request.params,
      ...request.body,
    } as { id: number; guid: string; sub: string };

    if (userGuid) {
      return this.validateGuid(userGuid, authenticatedUserGuid);
    }
    if (userId) {
      return await this.validateId(userId, authenticatedUserGuid);
    }
    return false;
  }

  validateGuid(userGuid: string, authenticatedUserGuid: string) {
    return authenticatedUserGuid && authenticatedUserGuid === userGuid;
  }

  async validateId(userId: number, authenticatedUserGuid: string) {
    const { guid } = await this.userRepository.findOne({
      select: ['guid'],
      where: { id: userId },
    });
    return guid === authenticatedUserGuid;
  }
}
