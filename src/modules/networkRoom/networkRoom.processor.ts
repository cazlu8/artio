import { Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkRoomService } from './networkRoom.service';
import { parallel } from '../../shared/utils/controlFlow.utils';
import { UserEvents } from '../userEvents/userEvents.entity';

const numCPUs = require('os').cpus().length;

@Processor('networkRoom')
export class NetworkRoomProcessor {
  private readonly redisClient: any;

  constructor(
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
        (await this.userEventsRepository.count({ eventId })) * isRepeat
          ? 0.2
          : 0.5;
      const rooms = Math.ceil(clientsAmount / 3);
      const createRoomFns = Array.from(new Array(rooms)).map(() =>
        this.createRoom(eventId),
      );
      parallel(createRoomFns, () => jobDone(null), 8);
    } catch (err) {
      throw new Error(err);
    }
  }

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
