import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { sesConfig } from '../../config/AWS';

const ses = new AWS.SES(sesConfig());

@Injectable()
export class EmailService {
  async sendBulkTicketCode(
    emails: string[],
    ticketCode: string,
    eventImg: string,
    eventName: string,
  ) {
    try {
      const destinations = emails.map(email => ({
        Destination: { ToAddresses: [email] },
      }));
      const variables = {
        ticketCode,
        eventName,
        eventImg,
        artioLogo: process.env.LOGO_EMAIL,
        artioUrl: process.env.FRONT_END_URL,
      };
      const params = {
        Destinations: destinations,
        Source: process.env.EMAIL_NO_REPLY,
        Template: 'sendTicketCode',
        DefaultTemplateData: JSON.stringify(variables),
      };
      await ses.sendBulkTemplatedEmail(params).promise();
    } catch (error) {
      throw new Error(error);
    }
  }
}
