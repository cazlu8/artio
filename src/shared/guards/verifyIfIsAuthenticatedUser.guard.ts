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
    const { sub: authenticatedUserGuid } = request.raw?.user;
    const { guid: userGuid, id: userId } = request.params;
    const { guid: userGuidBody, id: userIdBody } = request.body || {};
    if (userGuid || userGuidBody) {
      const guid = userGuid || userGuidBody;
      return this.validateGuid(guid, authenticatedUserGuid);
    }
    if (userId || userIdBody) {
      const id = userId || userIdBody;
      return await this.validateId(id, authenticatedUserGuid);
    }
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
