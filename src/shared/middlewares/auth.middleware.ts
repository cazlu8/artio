import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as util from 'util';
import * as jwt from 'jsonwebtoken';
import * as any from 'promise.any';

const verifyToken = util.promisify(jwt.verify);

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: any, reply: any, next: () => void) {
    try {
      const { authorization } = req.headers;
      const token = authorization.slice(7);
      req.user = await any([...this.validateToken(token)]);
      next();
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private validateToken(token: string) {
    return [
      process.env.JWT_SECRET_KEY_LOCAL,
      process.env.JWT_SECRET_KEY_STAGING,
    ].map(async key => {
      const publicKey = key.replace(/\\n/g, '\n');
      await verifyToken(token, publicKey);
    });
  }
}
