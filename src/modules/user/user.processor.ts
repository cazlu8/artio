import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserService } from './user.service';
import { EmailService } from '../../shared/services/email/email.service';
import { EventRepository } from '../event/event.repository';
import { SendEmailTicketCode } from '../../shared/types/user';
import { LoggerService } from '../../shared/services/logger.service';

const numCPUs = require('os').cpus().length;

@Processor('user')
export class UserProcessor {
  constructor(
    private readonly service: UserService,
    private readonly eventRepository: EventRepository,
    private readonly emailService: EmailService,
    @InjectQueue('user') private readonly userQueue: Queue,
    private readonly loggerService: LoggerService,
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
      this.loggerService.info(
        `preSaveUserAndBindToEvent: users with emails: ${JSON.stringify(
          emails,
        )} were pre saved and linked to event: ${eventId}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `preSaveUserAndBindToEvent: ${JSON.stringify(job?.data || {})}`,
        error,
      );
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
      this.loggerService.info(
        `sendTicketCodeEmail: the emails sent to: ${JSON.stringify(
          emails,
        )} about the ${eventId}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `sendTicketCodeEmail: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }

  async sendEmails(data: SendEmailTicketCode) {
    const { emails } = data;
    if (emails.length > 49) {
      const currentEmails = emails.splice(0, 49);
      await this.sendToQueue({ ...data, emails: currentEmails });
      await this.sendEmails({ ...data, emails });
    } else if (emails.length) {
      await this.sendToQueue(data);
    }
  }

  async sendToQueue(data: SendEmailTicketCode) {
    await this.emailService.sendBulkTicketCode(data);
  }
}
