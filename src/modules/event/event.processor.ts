import { InjectQueue, Process, Processor } from '@nestjs/bull';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import { Queue } from 'bull';
import { EventGateway } from './event.gateway';
import { LoggerService } from '../../shared/services/logger.service';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';

const numCPUs = require('os').cpus().length;

@Processor('event')
export class EventProcessor {
  private readonly redisClient: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventGateway: EventGateway,
    private readonly loggerService: LoggerService,
    private readonly repository: EventRepository,
    private readonly service: EventService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  @Process({ name: 'startIntermission', concurrency: numCPUs })
  async startIntermission(job, jobDone) {
    try {
      const { eventId, intermissionTime } = job.data;
      const [addCreateRoomOnQueueFn] = this.service.addRoomsToQueue(eventId);
      const [
        setIntermissionStartedAtFn,
        setIntermissionTimeFn,
        setIntermissionOnFn,
      ] = this.service.setIntermissionData(eventId, intermissionTime);
      await Promise.all([
        addCreateRoomOnQueueFn,
        setIntermissionOnFn,
        setIntermissionStartedAtFn,
        setIntermissionTimeFn,
      ]);
      await this.service.finishIntermission(eventId, intermissionTime);
      await this.eventQueue.add('sendMessageToUsersLinkedToEvent', {
        eventId,
        eventName: 'startIntermission',
      });
      this.loggerService.info(
        `startIntermission: intermission started for the ${eventId}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `startIntermission: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }

  @Process({ name: 'endIntermission', concurrency: numCPUs })
  async endIntermission(job, jobDone) {
    try {
      const { eventId } = job.data;
      await this.service.removeAllEventKeysAndSendEndIntermissionMessage(
        eventId,
      );
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

  @Process({ name: 'sendMessageToUsersLinkedToEvent', concurrency: numCPUs })
  async sendMessageToUsersLinkedToEvent(job, jobDone) {
    try {
      const { eventId, eventName } = job.data;
      const connectedUsers = await this.redisClient.smembers(
        'connectedUsersEvents',
      );
      if (connectedUsers.length) {
        await this.service.getConnectedUserAndSentEvent(
          connectedUsers,
          +eventId,
          eventName,
        );
        this.loggerService.info(
          `sendMessageToUsersLinkedToEvent: message: ${eventName} sent to event: ${eventId}`,
        );
      }
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `sendMessageToUsersLinkedToEvent: ${JSON.stringify(error)}`,
        error,
      );
    }
  }
}
