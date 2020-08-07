import { Process, Processor } from '@nestjs/bull';
import { UserService } from './user.service';

const numCPUs = require('os').cpus().length;

@Processor('user')
export class UserProcessor {
  constructor(private readonly service: UserService) {}

  @Process({ name: 'preSaveUserAndBindToEvent', concurrency: numCPUs })
  async clearExpiredRooms(job, jobDone) {
    const { emails, eventId } = job;
    await this.service.preSaveUsersAndBindToEvent(emails, eventId);
    jobDone();
  }
}
