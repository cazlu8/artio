import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { NetworkRoomService } from './networkRoom.service';
import { parallel } from '../../shared/utils/controlFlow.utils';
import { UserEvents } from '../userEvents/userEvents.entity';
import { catchError } from '../../shared/utils/errorHandler.utils';
import { LoggerService } from '../../shared/services/logger.service';

const numCPUs = require('os').cpus().length;

@Processor('networkRoom')
export class NetworkRoomProcessor {
  private readonly redisClient: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: Repository<UserEvents>,
    private readonly service: NetworkRoomService,
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
  ) {
    this.redisClient = this.redisService.getClient();
  }

  @Process({ name: 'createRooms', concurrency: numCPUs })
  async createRooms(job, jobDone) {
    try {
      const { eventId, isRepeat } = job.data;
      const clientsAmount =
        (await this.userEventsRepository.count({ eventId })) *
        (isRepeat ? 0.2 : 0.5);
      const rooms = Math.ceil(clientsAmount / 3);
      const createRoomFns = Array.from(new Array(rooms)).map(() =>
        this.createRoom(eventId),
      );
      parallel(createRoomFns, () => jobDone(), 32);
      this.loggerService.info(
        `createRooms: twilio rooms created for event: ${eventId}`,
      );
    } catch (error) {
      this.loggerService.error(
        `createRooms: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }

  @Process({ name: 'clearExpiredRooms', concurrency: numCPUs })
  async clearExpiredRooms(job, jobDone) {
    try {
      const { eventId } = job.data;
      await this.redisClient.del(`event-${eventId}:rooms`).catch(catchError);
      const isOnIntermission = await this.redisClient.get(
        `event-${eventId}:isOnIntermission`,
      );
      if (isOnIntermission) {
        await this.networkRoomQueue.add('createRooms', {
          eventId,
          isRepeat: true,
        });
        await this.networkRoomQueue.add(
          `clearExpiredRooms`,
          { eventId },
          { delay: 270000 },
        );
      }
      this.loggerService.info(
        `clearExpiredRooms: cleared rooms for event: ${eventId}`,
      );
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `clearExpiredRooms: ${JSON.stringify(job?.data || {})}`,
        error,
      );
    }
  }

  // force brute to handle too many requests error and get concurrency performance
  async createRoom(eventId: number) {
    return this.service
      .createRoom()
      .then(async ({ uniqueName }) => {
        await this.redisClient.rpush(`event-${eventId}:rooms`, uniqueName);
      })
      .catch(() => Promise.resolve(this.createRoom(eventId)));
  }
}
