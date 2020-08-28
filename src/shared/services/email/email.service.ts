import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SES from 'aws-sdk/clients/ses';
import { LoggerService } from '../logger.service';

@Injectable()
export class EmailService {
  private ses: SES;

  constructor(
    private configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.ses = new AWS.SES(this.configService.get('ses'));
  }

  async sendTemplateBulk(params: SES.Types.SendBulkTemplatedEmailRequest) {
    try {
      await this.ses.sendBulkTemplatedEmail(params).promise();
      this.loggerService.info(`email sent`);
    } catch (error) {
      this.loggerService.error(`error sending email:`, error);
    }
  }
}
