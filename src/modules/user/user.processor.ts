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
    const { emails, eventId } = job.data;
    const emailsToNotSend = (
      await this.service.getUserEmailsBindedToEvent(emails, eventId)
    )?.map(x => x.user_email);
    const emailsToSend = emailsToNotSend.length
      ? emails.filter(x => !emailsToNotSend.some(y => x === y))
      : emails;
    if (emailsToSend.length) {
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
  }

  @Process({ name: 'sendTicketCodeEmail', concurrency: numCPUs })
  async sendTicketCodeEmail(job, jobDone) {
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
  }

  async sendEmails(data: SendEmailTicketCode) {
    const { emails } = data;
    if (emails.length >= 50) {
      const currentEmails = emails.splice(0, 50);
      await this.sendToQueue(currentEmails, data);
      await this.sendEmails({ emails, ...data });
    } else {
      await this.sendToQueue(emails, data);
    }
  }

  async sendToQueue(emails, data: SendEmailTicketCode) {
    await this.emailService.sendBulkTicketCode({ emails, ...data });
  }
}
