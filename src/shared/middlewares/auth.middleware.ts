import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: any, reply: any, next: () => void) {
    try {
      const { authorization } = req.headers;
      const token = authorization.slice(7);
      req.user = await this.jwtService.validateToken(token);
      next();
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
