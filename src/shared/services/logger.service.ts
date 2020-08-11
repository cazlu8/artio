import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService {
  private winstonLogger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logger = winston.createLogger({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    if (process.env.NODE_ENV === 'production') {
      logger.add(new WinstonCloudWatch(this.configService.get('cloudWatch')));
    }
    this.winstonLogger = logger;
  }

  log(level = 'info', error, request: any = {}) {
    this.winstonLogger.log(
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

  info(error, request) {
    this.log('info', error, request);
  }
}
