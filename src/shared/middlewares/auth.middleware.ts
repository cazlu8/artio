import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as util from 'util';
import * as jwt from 'jsonwebtoken';

const verifyToken = util.promisify(jwt.verify);

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: any, reply: any, next: () => void) {
    try {
      const { authorization } = req.headers;
      const token = authorization.slice(7);
      const publicKey = process.env.JWT_SECRET_KEY.replace(/\\n/g, '\n');
      req.user = await verifyToken(token, publicKey);
      next();
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
