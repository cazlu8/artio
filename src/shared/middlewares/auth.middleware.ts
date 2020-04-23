import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import admin from 'firebase-admin';
//import firebaseConfig from '../config/firebase';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private firebase: admin.app.App;

  constructor() {
    //this.firebase = firebaseConfig();
  }

  async use(req: any, reply: any, next: () => void) {
    try {
      const { authorization } = req.headers;
      const token = authorization.slice(7);
   //   req.user = await this.firebase.auth().verifyIdToken(token);
      next();
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
