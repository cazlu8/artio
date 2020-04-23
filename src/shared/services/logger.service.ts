import { Log, Logging } from '@google-cloud/logging';
import { Injectable } from '@nestjs/common';
// passar p aws logging
@Injectable()
export class LoggerService {
  private projectId: string;

  private logName: string;

  private logger: Log;

  private metadata: {};

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.logName = process.env.GOOGLE_CLOUD_LOG_NAME;
    const logging = new Logging({ projectId: this.projectId });
    this.logger = logging.log(this.logName);
    this.metadata = {
      resource: { type: 'global' },
    };
  }

  log(text: string) {
    if (process.env.NODE_ENV === 'test') return;
    const entry = this.logger.entry(this.metadata, text);
    this.logger.write(entry).catch(console.log);
    console.log(`Logged: ${text}`);
  }
}
