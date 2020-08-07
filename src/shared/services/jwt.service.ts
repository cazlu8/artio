import * as util from 'util';
import * as jwt from 'jsonwebtoken';
import * as any from 'promise.any';
import { Injectable } from '@nestjs/common';

const verifyToken = util.promisify(jwt.verify);

@Injectable()
export class JwtService {
  private getValidators(token: string) {
    return [
      process.env.JWT_SECRET_KEY_LOCAL || '',
      process.env.JWT_SECRET_KEY_STAGING || '',
      process.env.JWT_SECRET_KEY_PROD || '',
    ].map(async key => {
      const publicKey = key.replace(/\\n/g, '\n');
      return await verifyToken(token, publicKey);
    });
  }

  async validateToken(token: string) {
    return await any([...this.getValidators(token)]);
  }
}
