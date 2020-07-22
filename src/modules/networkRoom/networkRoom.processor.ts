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
  async handleTranscode(job, jobDone) {
    try {
      const { eventId } = job.data;
      const clientsAmount = await this.userEventsRepository.count({ eventId });
      const rooms = Math.ceil(clientsAmount / 3.11);
      await this.redisClient.set('clientsAmount', clientsAmount);
      const fn = Array.from(new Array(rooms)).map(() => this.createRoom());
      parallel(fn, () => jobDone(null), 16);
    } catch (err) {
      console.log(err);
    }
  }

  async createRoom() {
    return this.service
      .createRoom()
      .then(
        async ({ uniqueName }) =>
          await this.redisClient.rpush('rooms', uniqueName),
      )
      .catch(() => Promise.resolve(this.createRoom()));
  }
}
