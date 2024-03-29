import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean | Promise<boolean> | Observable<boolean>> {
    try {
      if (process.env.NODE_ENV !== 'production') return true;
      const {
        auth: { token },
      } = context.switchToWs().getData();
      const socket = context.switchToWs().getClient();
      const { sub } = await this.tokenIsValid(token);
      socket.userId = sub;
      return true;
    } catch (error) {
      const socket = context.switchToWs().getClient();
      socket.disconnect();
      return false;
    }
  }

  async tokenIsValid(token: string) {
    if (process.env.NODE_ENV !== 'development') {
      return await this.jwtService.validateToken(token);
    }
    return true;
  }
}
