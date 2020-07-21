import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Mutex } from 'async-mutex';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import * as sleep from 'sleep';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';

const mutex = new Mutex();

@WebSocketGateway(3030)
export class NetworkRoomGateway {
  @WebSocketServer()
  server: Server;

  private readonly redisClient: any;

  private redlock: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly service: NetworkRoomService,
  ) {
    this.redisClient = this.redisService.getClient();
    this.redlock = new Redlock([this.redisClient], {
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', function(err) {
      console.error('A redis error has occurred:', err);
    });
  }

  @SubscribeMessage('triggerIntermission')
  async triggerIntermission() {
    await this.networkRoomQueue.add('createRooms');
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(client: any) {
    await mutex.runExclusive(async () => {
      sleep.msleep(100);
      return this.redlock
        .lock('locks:clientsNetworkRoomCounter', 2000)
        .then(async lock => {
          const counter = await this.incrementCounter();
          const room = await this.getRoom(counter);
          client.send(room);
          console.log(`${room}/${process.pid}/${counter}`);
          return lock.unlock().catch(console.log);
        });
    });
  }

  async getRoom(counter) {
    const oddCounter = +(await this.redisClient.get('oddCounter'));
    const lastRoom = await this.redisClient.get('lastRoom');
    if (
      !lastRoom ||
      (oddCounter > 0 && counter === 0) ||
      (oddCounter <= 0 && counter === 0)
    )
      return await this.getNewRoom();
    return await this.getLastRoom();
  }

  async incrementCounter(): Promise<number> {
    let counter =
      +(await this.redisClient.get('clientsNetworkRoomCounter')) || 0;
    if (counter === 3) {
      await this.redisClient.decr('oddCounter');
    }
    await this.redisClient.incr('processedCounter');
    const oddCounter = await this.redisClient.get('oddCounter');
    const clientsAmount = +(await this.redisClient.get('clientsAmount'));
    const processedCounter = +(await this.redisClient.get('processedCounter'));
    if (+oddCounter <= 0 && clientsAmount / 4 !== 2) {
      if (
        clientsAmount - processedCounter < 10 &&
        clientsAmount - processedCounter !== 0 &&
        processedCounter % 3 === 0 &&
        processedCounter % 4 !== 0
      ) {
        await this.redisClient.set('pass', 1);
        console.log('aki');
      }
    }
    const pass = +(await this.redisClient.get('pass'));
    if (+oddCounter >= 0 || pass === 1) {
      if (
        (counter === 3 && clientsAmount - processedCounter !== 0) ||
        counter === 4
      ) {
        if (pass === 1 && clientsAmount - processedCounter === 0) {
          await this.redisClient.set('pass', 0);
          console.log('aki2');
        }
        counter = 0;
        await this.redisClient.set('clientsNetworkRoomCounter', 1);
      } else await this.redisClient.incr('clientsNetworkRoomCounter');
    } else if (counter === 4) {
      counter = 0;
      await this.redisClient.set('clientsNetworkRoomCounter', 1);
    } else await this.redisClient.incr('clientsNetworkRoomCounter');

    return counter;
  }

  async getLastRoom() {
    return await this.redisClient.get('lastRoom');
  }

  async getNewRoom() {
    const newRoom = await this.redisClient.lpop('rooms');
    await this.setRoom('lastRoom', newRoom);
    return newRoom;
  }

  async setRoom(key: string, room: string | number) {
    await this.redisClient.set(key, room);
  }
}
