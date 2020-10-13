import { Process, Processor } from '@nestjs/bull';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import { LoggerService } from '../../shared/services/logger.service';
import { ChatGateway } from './chat.gateway';

const numCPUs = require('os').cpus().length;

@Processor('event')
export class ChatProcessor {
  private readonly redisClient: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
    private readonly chatGateway: ChatGateway,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  @Process({ name: 'sendMessageToSponsor', concurrency: numCPUs })
  async sendMessageToSponsor(job, jobDone) {
    try {
      const { params, sponsorGuid, eventName } = job.data;
      const sponsorSocketIds = await this.redisClient.hget(
        `connectedUsersChat`,
        sponsorGuid,
      );
      const sponsorSocketIdsFormatted =
        sponsorSocketIds !== null ? JSON.parse(sponsorSocketIds) : [];
      sponsorSocketIdsFormatted.forEach(to =>
        this.chatGateway.server.to(to).emit(eventName, {
          ...params,
        }),
      );
      this.loggerService.info(
        `sendMessageToSponsor: message sent to sponsor ${sponsorGuid}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `sendMessageToSponsor: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }
}
