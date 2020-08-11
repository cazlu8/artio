import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { sesConfig } from '../../config/AWS';
import { SendEmailTicketCode } from '../../types/user';

const ses = new AWS.SES(sesConfig());

@Injectable()
export class EmailService {
  async sendBulkTicketCode(data: SendEmailTicketCode) {
    try {
      const { emails, ticketCode, eventName, eventImg, eventDate } = data;
      const destinations = emails.map(email => ({
        Destination: { ToAddresses: [email] },
      }));
      const variables = {
        ticketCode,
        eventName,
        eventImg,
        eventDate,
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
      console.log('error email', error);
      throw new Error(error);
    }
  }
}
