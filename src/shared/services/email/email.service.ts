import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SES from 'aws-sdk/clients/ses';
import { SendEmailTicketCode } from '../../types/user';

@Injectable()
export class EmailService {
  private ses: SES;

  constructor(private configService: ConfigService) {
    this.ses = new AWS.SES(this.configService.get('ses'));
  }

  async sendBulkTicketCode(data: SendEmailTicketCode) {
    const { emails, ticketCode, eventName, eventImg, eventDate } = data;
    const destinations = emails.map(email => ({
      Destination: { ToAddresses: [email] },
    }));
    const variables = {
      ticketCode,
      eventName,
      eventImg,
      eventDate,
      artioLogo: process.env.LOGO_EMAIL_IMG,
      artioUrl: process.env.FRONT_END_URL,
    };
    const params = {
      Destinations: destinations,
      Source: process.env.EMAIL_NO_REPLY,
      Template: 'sendTicketCode',
      DefaultTemplateData: JSON.stringify(variables),
    };
    await this.ses.sendBulkTemplatedEmail(params).promise();
  }
}
