import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserService } from './user.service';
import { EmailService } from '../../shared/services/email/email.service';
import { EventRepository } from '../event/event.repository';

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
    const ticketCode = await this.service.preSaveUsersAndBindToEvent(
      emails,
      eventId,
    );
    await this.userQueue.add('sendTicketCodeEmail', {
      emails,
      eventId,
      ticketCode,
    });
    jobDone();
  }

  @Process({ name: 'sendTicketCodeEmail', concurrency: numCPUs })
  async sendTicketCodeEmail(job, jobDone) {
    const { emails, eventId, ticketCode } = job.data;
    const {
      heroImgUrl: eventImg,
      name: eventName,
    } = await this.eventRepository.get({
      where: { id: eventId },
      select: ['heroImgUrl', 'name'],
    });
    await this.emailService.sendBulkTicketCode(
      emails,
      ticketCode,
      eventImg,
      eventName,
    );
    jobDone();
  }
}
