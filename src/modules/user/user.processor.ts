import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserService } from './user.service';
import { EmailService } from '../../shared/services/email/email.service';
import { EventRepository } from '../event/event.repository';
import { SendEmailTicketCode } from '../../shared/types/user';
import { LoggerService } from '../../shared/services/logger.service';
import { UserEventsRepository } from '../userEvents/userEvents.repository';

const numCPUs = require('os').cpus().length;

@Processor('user')
export class UserProcessor {
  constructor(
    private readonly emailService: EmailService,
    private readonly service: UserService,
    private readonly eventRepository: EventRepository,
    private readonly userEventsRepository: UserEventsRepository,
    @InjectQueue('user') private readonly userQueue: Queue,
    private readonly loggerService: LoggerService,
  ) {}

  @Process({ name: 'preSaveUserAndBindToEvent', concurrency: numCPUs })
  async preSaveUserAndBindToEvent(job, jobDone) {
    try {
      const { emails, eventId } = job.data;
      let emailsToSave;
      if (emails?.length) {
        emailsToSave = await this.service.filterAlreadyRegisteredEmails(
          emails,
          eventId,
        );
        if (emailsToSave.length) {
          const ticketCode = await this.service.preSaveUsersAndBindToEvent(
            emailsToSave,
            eventId,
          );
          await this.userQueue.add('sendTicketCodeEmail', {
            emails: emailsToSave,
            eventId,
            ticketCode,
          });
        }
      }
      this.loggerService.info(
        `preSaveUserAndBindToEvent: users with emails: ${JSON.stringify(
          emailsToSave,
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
      await this.sendToQueue(data);
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

  async sendToQueue(data: SendEmailTicketCode) {
    const { emails } = data;
    if (emails.length > 49) {
      const currentEmails = emails.splice(0, 49);
      await this.sendEmails({ ...data, emails: currentEmails });
      await this.sendToQueue({ ...data, emails });
    } else if (emails.length) {
      await this.sendEmails(data);
    }
  }

  async sendEmails(data: SendEmailTicketCode) {
    const { emails, ticketCode, eventName, eventImg, eventDate } = data;
    const destinations = emails.map((email) => ({
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
    await this.emailService.sendTemplateBulk(params);
  }
}
