import { Injectable } from '@nestjs/common';
// passar p aws logging
@Injectable()
export class LoggerService {
  private projectId: string;

  private logName: string;

  private metadata: {};

  constructor() {

  }

  log(text: string) {

  }
}
