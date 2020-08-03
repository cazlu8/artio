import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { NetworkRoomService } from './networkRoom.service';
import { parallel } from '../../shared/utils/controlFlow.utils';
import { UserEvents } from '../userEvents/userEvents.entity';
import { catchError } from '../../shared/utils/errorHandler.utils';

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
  ) {
    this.redisClient = this.redisService.getClient();
  }

  @Process({ name: 'createRooms', concurrency: numCPUs })
  async createRooms(job, jobDone) {
    try {
      const { eventId, isRepeat } = job.data;
      const clientsAmount =
        (await this.userEventsRepository.count({ eventId })) *
        (isRepeat ? 0.3 : 0.8);
      const rooms = Math.ceil(clientsAmount / 3);
      const createRoomFns = Array.from(new Array(rooms)).map(() =>
        this.createRoom(eventId),
      );
      parallel(createRoomFns, () => jobDone(null), 32);
      console.log('processou paaa');
    } catch (error) {
      console.log('deu pau', error);
      catchError(error);
    }
  }

  @Process({ name: 'clearExpiredRooms', concurrency: numCPUs })
  async clearExpiredRooms(job, jobDone) {
    try {
      const { eventId } = job.data;
      await this.redisClient.del(`event-${eventId}:rooms`).catch(catchError);
      await this.networkRoomQueue.add('createRooms', {
        eventId,
        isRepeat: true,
      });
      await this.networkRoomQueue.add(
        `clearExpiredRooms`,
        { eventId },
        { delay: 270000 },
      );
      console.log(`matou as rooms`);
      jobDone();
    } catch (error) {
      console.log('deu pau', error);
      catchError(error);
    }
  }

  // force brute to handle too many requests error and get concurrency performance
  async createRoom(eventId: number) {
    return this.service
      .createRoom()
      .then(
        async ({ uniqueName }) =>
          await this.redisClient.rpush(`event-${eventId}:rooms`, uniqueName),
      )
      .catch(() => Promise.resolve(this.createRoom(eventId)));
  }
}
