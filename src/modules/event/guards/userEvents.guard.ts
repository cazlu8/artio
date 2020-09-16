import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { EventRepository } from '../event.repository';

@Injectable()
export class UserEventsGuard implements CanActivate {
  constructor(private readonly repository: EventRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return await this.validateRequest(request);
  }

  async validateRequest(request: any) {
    if (process.env.NODE_ENV === 'production') {
      const {
        user: { sub },
      } = request.raw;
      const userIds = await this.repository.getUserIdByGuid([sub]);
      return !!userIds && !!userIds.length;
    }
    return true;
  }
}
