import { Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { catchError } from '../../shared/utils/errorHandler.utils';

const numCPUs = require('os').cpus().length;

@Processor('event')
export class EventProcessor {
  private readonly redisClient: any;

  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getClient();
  }

  @Process({ name: 'clearIntermissionData', concurrency: numCPUs })
  async clearIntermissionData(job, jobDone) {
    try {
      const { eventId } = job.data;
      const removeAllKeys = [
        `event-${eventId}:lastRoom`,
        `event-${eventId}:rooms`,
        `event-${eventId}:clientsNetworkRoomCounter`,
        `event-${eventId}`,
      ].map(key => this.redisClient.del(key));
      await Promise.all(removeAllKeys);
      jobDone();
      console.log(`clearIntermission`);
    } catch (error) {
      catchError(error);
    }
  }
}
