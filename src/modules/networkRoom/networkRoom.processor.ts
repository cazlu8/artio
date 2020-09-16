import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Lock from 'redis-lock';
import * as bluebird from 'bluebird';
import { Queue } from 'bull';
import { promisify } from 'util';
import { NetworkRoomService } from './networkRoom.service';
import { parallel } from '../../shared/utils/controlFlow.utils';
import { UserEvents } from '../userEvents/userEvents.entity';
import { LoggerService } from '../../shared/services/logger.service';
import networkEventEmitter from './networkRoom.event';

const numCPUs = require('os').cpus().length;

@Processor('networkRoom')
export class NetworkRoomProcessor {
  private readonly redisClient: any;

  private readonly lock: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: Repository<UserEvents>,
    private readonly service: NetworkRoomService,
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
    this.lock = promisify(Lock(this.redisClient));
  }

  @Process({ name: 'createRooms', concurrency: numCPUs })
  async createRooms(job, jobDone) {
    try {
      const { eventId, isRepeat } = job.data;
      if (!isRepeat) {
        await this.redisClient.set(
          `event-${eventId}:twilioRoomThreeLength`,
          'true',
          'EX',
          120,
        );
        setTimeout(() => {
          networkEventEmitter.emit('changedQueuesOrRooms', eventId);
          networkEventEmitter.emit('SwitchRoom', eventId);
        }, 120000);
      }
      const clientsAmount =
        (await this.userEventsRepository.count({ eventId })) *
        (isRepeat ? 0.2 : 0.5);
      const rooms = Math.ceil(clientsAmount / 3);
      const createRoomFns = Array.from(new Array(rooms)).map(() =>
        this.service.createRoomAndSave(eventId),
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
      await this.redisClient.del(`event-${eventId}:roomsTwilio`);
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
    const unlock = await this.lock('switchRoomFindAvailableRooms');
    try {
      const { eventId } = job.data;
      const roomsWithScores = await this.service.getRoomsWithScores(
        eventId,
        true,
      );
      if (!roomsWithScores.length)
        await this.networkRoomQueue.add('sendRoomToPairs', { eventId });
      else {
        const queueLength = await this.redisClient.llen(
          `event-${eventId}:queue`,
        );
        if (queueLength && roomsWithScores.length) {
          await this.service.findAvailableRoom(eventId, roomsWithScores);
        }
      }
      jobDone();
    } catch (error) {
      this.loggerService.error(
        `findAvailableRooms: ${JSON.stringify(error)}`,
        error,
      );
    } finally {
      unlock();
    }
  }

  @Process({ name: 'sendRoomToPairs', concurrency: numCPUs })
  async sendRoomToPairs(job, jobDone) {
    const unlock = await this.lock('sendRoomToPairs');
    try {
      const { eventId } = job.data;
      const queueLength = await this.redisClient.llen(`event-${eventId}:queue`);

      if (queueLength >= 2) {
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
    } finally {
      unlock();
    }
  }

  @Process({ name: 'switchRoom', concurrency: numCPUs })
  async switchRoom(job, jobDone) {
    const unlock = await this.lock('switchRoomFindAvailableRooms');
    try {
      const { eventId } = job.data;
      const lengthSwitch = await this.redisClient.llen(
        `event-${eventId}:queueSwitch`,
      );
      const clients = await this.redisClient.lrange(
        `event-${eventId}:queueSwitch`,
        0,
        -1,
      );
      const parsedClients = clients.map(JSON.parse);
      if (
        lengthSwitch >= 2 &&
        parsedClients.some(
          ({ currentRoom }) => currentRoom !== parsedClients[0].currentRoom,
        )
      ) {
        const room = await this.service.createRoomAndSave(eventId);
        await this.redisClient.zadd(`event-${eventId}:rooms`, 0, room);
        const sendToSwitch = parsedClients
          .filter(
            ({ currentRoom }) => currentRoom !== parsedClients[0].currentRoom,
          )
          .concat(parsedClients[0])
          .slice(-2)
          .map(({ socketId }) => {
            return this.service.switchRoom(eventId, socketId, room);
          });
        for (const current of sendToSwitch) await current;

        this.loggerService.info(
          `switchRoom: created a new room for the event ${eventId}`,
        );
        return;
      }
      if (lengthSwitch) {
        const roomsWithScores = await this.service.getRoomsWithScores(eventId);
        await this.service.findRoomToSwitch(eventId, roomsWithScores);
      }
      jobDone();
    } catch (error) {
      this.loggerService.error(`switchRoom: ${JSON.stringify(error)}`, error);
    } finally {
      unlock();
    }
  }
}
