import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { msleep } from 'sleep';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';

@WebSocketGateway(3030, { transports: ['websocket'] })
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
    this.redlock.on('clientError', error => {
      throw new Error(error);
    });
  }

  @SubscribeMessage('triggerIntermission')
  async triggerIntermission(socket: any, data: { eventId }) {
    await this.networkRoomQueue.add('createRooms', data);
    this.clearExpiredTwillioRooms(data.eventId);
    this.server.sockets.emit(`triggerIntermission`, true);
  }

  @SubscribeMessage('requestAvailableRoom')
  async requestAvailableRoom(socket: any, data: { eventId: number }) {
    const { eventId } = data;
    this.leaveRoom(socket);
    const decreaseCounter = this.redisClient.decr(
      `event-${eventId}:clientsNetworkRoomCounter`,
    );
    const getAvailableRoom = this.service.getAvailableRoom();
    await Promise.all([getAvailableRoom, decreaseCounter]).then(
      ([availableRoom]) => {
        if (availableRoom) socket.emit(`AvailableRoom`, availableRoom);
        else socket.emit(`AvailableRoom`, false);
      },
    );
  }

  @SubscribeMessage('requestAvailableRoom')
  async switchRoom(socket: any, data: { currentRoom: string }) {
    const { currentRoom } = data;
    this.leaveRoom(socket);
    const { uniqueName: newRoom } = await this.service.getAvailableRoom(
      currentRoom,
    );
    if (newRoom) socket.emit(`switchRoom`, newRoom);
    else socket.emit(`switchRoom`, false);
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(socket: any, data: { eventId: number }): Promise<void> {
    msleep(200);
    const { eventId } = data;
    this.redlock
      .lock(`event-${eventId}:locks:clientsNetworkRoomCounter`, 4000)
      .then(async lock => {
        const counter = +(await this.incrementCounter(eventId));
        await this.bindSocketToRoom(socket, eventId);
        await this.send(counter, eventId);
        return lock.unlock().catch(err => {
          throw new Error(err);
        });
      });
  }

  async bindSocketToRoom(socket: any, eventId: number): Promise<void> {
    const lastRoom =
      +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
    socket.join(`event-${eventId}:room-${lastRoom}`);
  }

  async send(counter: number, eventId: number): Promise<void> {
    if (counter % 3 === 0) await this.sendTwillioRoomToSockets(eventId);
  }

  async sendTwillioRoomToSockets(eventId: number): Promise<void> {
    const getLastRoom = this.redisClient.get(`event-${eventId}:lastRoom`);
    const getNewTwillioRoom = this.getNewTwillioRoom(eventId);
    const incrementLastRoom = this.redisClient.incr(
      `event-${eventId}:lastRoom`,
    );
    await Promise.all([getLastRoom, getNewTwillioRoom, incrementLastRoom]).then(
      ([lastRoom, newTwillioRoom]) => {
        this.server
          .to(`event-${eventId}:room-${+lastRoom}`)
          .emit(newTwillioRoom);
        console.log(`${newTwillioRoom}/${process.pid}/${+lastRoom}`);
      },
    );
  }

  async incrementCounter(eventId: number): Promise<number> {
    await this.redisClient.incr(`event-${eventId}:clientsNetworkRoomCounter`);
    return await this.redisClient.get(
      `event-${eventId}:clientsNetworkRoomCounter`,
    );
  }

  async getNewTwillioRoom(eventId: number): Promise<string> {
    await this.requestToCreateNewRooms(eventId);
    const newRoom = await this.redisClient.lpop(`event-${eventId}:rooms`);
    let fallbackRoom;
    if (!newRoom) fallbackRoom = (await this.service.createRoom()).uniqueName;
    return newRoom || fallbackRoom;
  }

  async requestToCreateNewRooms(eventId: number): Promise<void> {
    const roomsLength = +(await this.redisClient.llen(
      `event-${eventId}:rooms`,
    ));
    if (roomsLength < 4) {
      await this.networkRoomQueue.add('createRooms', { eventId });
      this.clearExpiredTwillioRooms(eventId);
      msleep(1000);
    }
  }

  clearExpiredTwillioRooms(eventId: number): void {
    setTimeout(async () => {
      await this.redisClient.del(`event-${eventId}:rooms`);
    }, 240000);
  }

  leaveRoom(socket: any): void {
    const formerRoom = socket.rooms[1];
    socket.leaveRoom(formerRoom);
  }
}
