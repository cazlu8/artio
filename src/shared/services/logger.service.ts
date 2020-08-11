import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchConfigError, CloudWatchConfigInfo } from '../config/logger';

@Injectable()
export class LoggerService {
  private winstonLoggerInfo: winston.Logger;

  private winstonLoggerError: winston.Logger;

  constructor() {
    const infoLogger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    const errorLogger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    if (process.env.NODE_ENV === 'production') {
      infoLogger.add(new WinstonCloudWatch(CloudWatchConfigInfo()));
      errorLogger.add(new WinstonCloudWatch(CloudWatchConfigError()));
    }
    this.winstonLoggerInfo = infoLogger;
    this.winstonLoggerError = errorLogger;
  }

  errorLog(level, error, request: any = {}) {
    this.winstonLoggerError.log(
      level,
      `Requesting ${request?.raw?.method} ${request?.raw?.originalUrl}`,
      {
        tags: 'http',
        additionalInfo: {
          body: request?.body,
          headers: request?.headers,
          error,
        },
      },
    );
  }

  infoLog(level, message) {
    this.winstonLoggerInfo.log(level, `${message}`);
  }

  error(error, request) {
    this.errorLog('error', error, request);
  }

  info(message) {
    this.infoLog('info', message);
  }
}
