import { Process, Processor } from '@nestjs/bull';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import { EventGateway } from './event.gateway';
import { LoggerService } from '../../shared/services/logger.service';

const numCPUs = require('os').cpus().length;

@Processor('event')
export class EventProcessor {
  private readonly redisClient: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventGateway: EventGateway,
    private readonly loggerService: LoggerService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  @Process({ name: 'endIntermission', concurrency: numCPUs })
  async endIntermission(job, jobDone) {
    try {
      const { eventId } = job.data;
      const removeAllKeys = [
        `event-${eventId}:lastRoom`,
        `event-${eventId}:rooms`,
        `event-${eventId}:clientsNetworkRoomCounter`,
        `event-${eventId}`,
      ].map(key => this.redisClient.del(key));
      await Promise.all(removeAllKeys);
      await this.redisClient.flushdb();
      this.eventGateway.server.emit('endIntermission', { eventId });
      this.loggerService.info(
        `endIntermission: intermission ended for the ${eventId}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `endIntermission: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }
}
