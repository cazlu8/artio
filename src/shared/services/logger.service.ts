import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchConfig } from '../config/logger';

@Injectable()
export class LoggerService {
  private winstonLogger: winston.Logger;

  constructor() {
    const logger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    if (process.env.NODE_ENV === 'production') {
      logger.add(new WinstonCloudWatch(CloudWatchConfig()));
    }
    this.winstonLogger = logger;
  }

  log(level = 'info', error, request) {
    this.winstonLogger.log(
      level,
      `Requesting ${request.raw.method} ${request.raw.originalUrl}`,
      {
        tags: 'http',
        additionalInfo: { body: request.body, headers: request.headers },
      },
    );
  }

  info(error, request) {
    this.log('info', error, request);
  }
}
