import { Process, Processor } from '@nestjs/bull';
import { RedisService } from 'nestjs-redis';
import { NetworkRoomService } from './networkRoom.service';
import { NetworkRoomGateway } from './networkRoom.gateway';
import { parallel } from '../../shared/utils/controlFlow.utils';

const numCPUs = require('os').cpus().length;

@Processor('networkRoom')
export class NetworkRoomProcessor {
  private readonly redisClient: any;

  constructor(
    private readonly gateway: NetworkRoomGateway,
    private readonly service: NetworkRoomService,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getClient();
  }

  @Process({ name: 'createRooms', concurrency: numCPUs })
  async handleTranscode(job, jobDone) {
    try {
      const clientsAmount = 100;
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
