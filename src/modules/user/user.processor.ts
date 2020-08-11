import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserService } from './user.service';
import { EmailService } from '../../shared/services/email/email.service';
import { EventRepository } from '../event/event.repository';
import { SendEmailTicketCode } from '../../shared/types/user';

const numCPUs = require('os').cpus().length;

@Processor('user')
export class UserProcessor {
  constructor(
    private readonly service: UserService,
    private readonly eventRepository: EventRepository,
    private readonly emailService: EmailService,
    @InjectQueue('user') private readonly userQueue: Queue,
  ) {}

  @Process({ name: 'preSaveUserAndBindToEvent', concurrency: numCPUs })
  async preSaveUserAndBindToEvent(job, jobDone) {
    try {
      const { emails, eventId } = job.data;
      const emailsToNotSend = (
        await this.service.getUserEmailsBindedToEvent(emails, eventId)
      )?.map(x => x.user_email);
      const emailsToSend = emailsToNotSend.length
        ? emails.filter(x => !emailsToNotSend.some(y => x === y))
        : emails;
      if (emailsToSend?.length) {
        const ticketCode = await this.service.preSaveUsersAndBindToEvent(
          emailsToSend,
          eventId,
        );
        await this.userQueue.add('sendTicketCodeEmail', {
          emails: emailsToSend,
          eventId,
          ticketCode,
        });
      }
      jobDone();
    } catch (error) {
      console.log('error pre save users', error);
    }
  }

  @Process({ name: 'sendTicketCodeEmail', concurrency: numCPUs })
  async sendTicketCodeEmail(job, jobDone) {
    try {
      const { emails, eventId, ticketCode } = job.data;
      const {
        heroImgUrl: eventImg,
        name: eventName,
        date: eventDate,
      } = await this.eventRepository.getEventDataToTicketCodeEmail(eventId);
      const data: SendEmailTicketCode = {
        emails,
        ticketCode,
        eventImg,
        eventName,
        eventDate,
      };
      await this.sendEmails(data);
      jobDone();
    } catch (error) {
      console.log('error send email', error);
    }
  }

  async sendEmails(data: SendEmailTicketCode) {
    const { emails } = data;
    if (emails.length > 49) {
      const currentEmails = emails.splice(0, 49);
      await this.sendToQueue({ ...data, emails: currentEmails });
      console.log('emails:', JSON.stringify(currentEmails));
      console.log('emails.length', currentEmails.length);
      await this.sendEmails({ ...data, emails });
    } else if (emails.length) {
      await this.sendToQueue(data);
      console.log('emails:', JSON.stringify(emails));
      console.log('emails.length', emails.length);
    }
  }

  async sendToQueue(data: SendEmailTicketCode) {
    await this.emailService.sendBulkTicketCode(data);
  }
}
