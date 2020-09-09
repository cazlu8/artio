import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bluebird from 'bluebird';
import { Queue } from 'bull';
import { NetworkRoomService } from './networkRoom.service';
import { parallel } from '../../shared/utils/controlFlow.utils';
import { UserEvents } from '../userEvents/userEvents.entity';
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
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
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
        this.service.createRooms(eventId),
      );
      parallel(createRoomFns, () => jobDone(), 16);
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
      await this.redisClient.zremrangebyrank(`event-${eventId}:rooms`, 0 - 1);
      await this.redisClient.zremrangebyscore(`event-${eventId}:rooms`, 0, 0);
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

  @Process({ name: 'findAvailableRooms', concurrency: numCPUs })
  async findAvailableRooms(job, jobDone) {
    try {
      const { eventId } = job.data;
      const roomsWithScores = await this.service.getRoomsWithScores(eventId);
      if (!roomsWithScores.length)
        await this.networkRoomQueue.add('sendRoomToPairs', { eventId });
      else {
        const queueLength = await this.redisClient.llen(
          `event-${eventId}:queue`,
        );
        if (queueLength && roomsWithScores.length) {
          const position = 0;
          while (
            roomsWithScores.length &&
            !!(await this.redisClient.llen(`event-${eventId}:queue`))
          ) {
            await this.service.findAvailableRoom(
              position,
              eventId,
              roomsWithScores,
            );
          }
        }
      }
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `findAvailableRooms: ${JSON.stringify(error)}`,
        error,
      );
    }
  }

  @Process({ name: 'sendRoomToPairs', concurrency: numCPUs })
  async sendRoomToPairs(job, jobDone) {
    try {
      const { eventId } = job.data;
      const queueLength = await this.redisClient.llen(`event-${eventId}:queue`);
      if (queueLength) {
        const room = await this.service.getQueueSocketIdsAndSendRoom(
          eventId,
          0,
        );
        await this.service.switchRoom(eventId, room);
        this.loggerService.info(
          `sendRoomToPairs:switchRoom: room ${room} sent to sockets for the event ${eventId}`,
        );
      }
      const queueLengthUpdated = await this.redisClient.llen(
        `event-${eventId}:queue`,
      );
      if (queueLengthUpdated >= 2) {
        const room = await this.service.getQueueSocketIdsAndSendRoom(eventId);
        this.loggerService.info(
          `sendRoomToPairs: room ${room} sent to sockets for the event ${eventId}`,
        );
      }
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `sendRoomToPairs: ${JSON.stringify(error)}`,
        error,
      );
    }
  }
}
