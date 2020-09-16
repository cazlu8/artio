import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRepository } from '../../user/user.repository';
import { UserEventsRepository } from '../../userEvents/userEvents.repository';

@Injectable()
export class UserEventsGuard implements CanActivate {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userEventsRepository: UserEventsRepository,
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
      return await this.userEventsRepository.exists({
        userId: userIds[0].id,
        eventId: request.params.id,
      });
    }
    return true;
  }
}
