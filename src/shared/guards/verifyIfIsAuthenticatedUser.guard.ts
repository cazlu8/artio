import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class VerifyIfIsAuthenticatedUserGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return await this.validateRequest(request);
  }

  async validateRequest(request: any) {
    const { uid: authenticatedUserGuid } = request.raw?.user;
    const { guid: userGuid, id: userId } = request.params;
    if (userGuid) return this.validateGuid(userGuid, authenticatedUserGuid);
    if (userId) return await this.validateId(userId, authenticatedUserGuid);
    return false;
  }

  validateGuid(userGuid, authenticatedUserGuid) {
    return authenticatedUserGuid && authenticatedUserGuid === userGuid;
  }

  async validateId(userId, authenticatedUserGuid) {
    const { guid } = await this.userService.getUserGuid(userId);
    return guid === authenticatedUserGuid;
  }
}
