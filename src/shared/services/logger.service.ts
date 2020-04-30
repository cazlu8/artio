import { Injectable } from '@nestjs/common';
// passar p aws logging
@Injectable()
export class LoggerService {
  log(text: string) {
    console.log(text);
  }
}
