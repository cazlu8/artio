import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SES from 'aws-sdk/clients/ses';

@Injectable()
export class EmailService {
  private ses: SES;

  constructor(private configService: ConfigService) {
    this.ses = new AWS.SES(this.configService.get('ses'));
  }

  async sendTemplateBulk(params: SES.Types.SendBulkTemplatedEmailRequest) {
    await this.ses.sendBulkTemplatedEmail(params).promise();
  }
}
