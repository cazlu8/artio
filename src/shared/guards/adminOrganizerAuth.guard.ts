import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminOrganizerAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  validateRequest(request: any) {
    if (process.env.NODE_ENV !== 'development') {
      const toValidate = request.raw.user['cognito:groups'];
      return toValidate.some((e: string) => e === 'Organizer' || e === 'Admin');
    }
    return true;
  }
}
