import { InjectQueue, Process, Processor } from '@nestjs/bull';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import { Queue } from 'bull';
import axios from 'axios';
import { EventGateway } from './event.gateway';
import { LoggerService } from '../../shared/services/logger.service';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';
import { EventStagesRepository } from '../eventStages/eventStages.repository';

const numCPUs = require('os').cpus().length;

@Processor('event')
export class EventProcessor {
  private readonly redisClient: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventGateway: EventGateway,
    private readonly loggerService: LoggerService,
    private readonly repository: EventRepository,
    private readonly eventStagesRepository: EventStagesRepository,
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

  @Process({
    name: 'stopMediaLiveChannelAndDestroyInfra',
    concurrency: numCPUs,
  })
  async stopMediaLiveChannelAndDestroyInfra(job, jobDone) {
    try {
      const { eventId, stageId } = job.data;
      const {
        region,
        mediaLiveChannelId,
      } = await this.eventStagesRepository.findOne({
        select: ['region', 'mediaLiveChannelId'],
        where: { id: stageId },
      });
      await axios.post(process.env.LAMBDA_STOP_MEDIA_LIVE_CHANNEL, {
        mediaLiveChannelId,
        region,
      });
      await this.eventQueue.add(
        'destroyInfra',
        { eventId, stageId },
        {
          delay: 20000,
        },
      );
      this.loggerService.info(
        `stopMediaLiveChannelAndDestroyInfra: message: media live channel of event ${eventId} was stopped`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `stopMediaLiveChannelAndDestroyInfra: ${JSON.stringify(error)}`,
        error,
      );
    }
  }

  @Process({ name: 'destroyInfra', concurrency: numCPUs })
  async destroyInfra(job, jobDone) {
    try {
      const { eventId, stageId } = job.data;
      const {
        region,
        mediaLiveChannelId,
        cdnDistributionId: distributionId,
      } = await this.eventStagesRepository.findOne({
        select: ['region', 'mediaLiveChannelId', 'cdnDistributionId'],
        where: { id: stageId },
      });
      await axios.post(process.env.LAMBDA_DESTROY_INFRA, {
        region,
        mediaLiveChannelId,
        distributionId,
      });
      await this.eventQueue.add(
        'destroyDistributionAndInputInfra',
        { eventId, stageId },
        {
          delay: 300000,
        },
      );
      this.loggerService.info(
        `destroyInfra: message: infra live of event ${eventId} was destroyed`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(`destroyInfra: ${JSON.stringify(error)}`, error);
    }
  }

  @Process({ name: 'destroyDistributionAndInputInfra', concurrency: numCPUs })
  async destroyDistributionAndInputInfra(job, jobDone) {
    try {
      const { eventId, stageId } = job.data;
      const {
        region,
        mediaLiveInputId,
        cdnDistributionId: distributionId,
      } = await this.eventStagesRepository.findOne({
        select: ['region', 'mediaLiveInputId', 'cdnDistributionId'],
        where: { id: stageId },
      });
      await axios.post(process.env.LAMBDA_DESTROY_DISTRIBUTION_INPUT, {
        region,
        mediaLiveInputId,
        distributionId,
      });
      this.loggerService.info(
        `destroyDistributionAndInputInfra: message: infra live of event ${eventId} was destroyed`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `destroyDistributionAndInputInfra: ${JSON.stringify(error)}`,
        error,
      );
    }
  }
}
