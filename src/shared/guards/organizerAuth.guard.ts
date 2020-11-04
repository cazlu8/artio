import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OrganizerAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  validateRequest(request: any) {
    if (process.env.NODE_ENV === 'production') {
      const toValidate = request.raw.user['cognito:groups'];
      const role = ['Organizer'];
      return Array.isArray(role)
        ? role.some((r) => toValidate?.indexOf(r) >= 0)
        : Array.isArray(toValidate) && toValidate?.includes(role);
    }
    return true;
  }
}
