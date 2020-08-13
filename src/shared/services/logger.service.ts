import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService {
  private winstonLoggerInfo: winston.Logger;

  private winstonLoggerError: winston.Logger;

  constructor(private configService: ConfigService) {
    const infoLogger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    const errorLogger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    if (process.env.NODE_ENV === 'production') {
      infoLogger.add(
        new WinstonCloudWatch(this.configService.get('cloudWatchLogInfo')),
      );
      errorLogger.add(
        new WinstonCloudWatch(this.configService.get('cloudWatchLogError')),
      );
    }
    this.winstonLoggerInfo = infoLogger;
    this.winstonLoggerError = errorLogger;
  }

  private errorRequestLog(level, error, request: any = {}) {
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

  private errorLog(level: string, message, error: any) {
    this.winstonLoggerError.log(level, message, JSON.stringify(error));
  }

  private infoLog(level, message) {
    this.winstonLoggerInfo.log(level, `${message}`);
  }

  errorRequest(error, request) {
    this.errorRequestLog('error', error, request);
  }

  error(message, error) {
    this.errorLog('error', message, error);
  }

  info(message) {
    this.infoLog('info', message);
  }
}
