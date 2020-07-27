import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { msleep } from 'sleep';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { catchError } from '../../shared/utils/errorHandler.utils';

@WebSocketGateway(3030, { transports: ['websocket'] })
export class NetworkRoomGateway {
  @WebSocketServer()
  server: any;

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
    this.redlock.on('clientError', catchError);
  }

  @SubscribeMessage('triggerIntermission')
  async triggerIntermission(socket: any, data: { eventId }): Promise<void> {
    try {
      await this.networkRoomQueue.add('createRooms', data, {
        priority: 1,
        removeOnComplete: true,
      });
      this.clearExpiredTwillioRooms(data.eventId);
      this.server.sockets.emit(`startIntermission`, true);
    } catch (error) {
      catchError(error);
    }
  }

  @SubscribeMessage('requestAvailableRoom')
  async requestAvailableRoom(
    socket: any,
    data: { eventId: number },
  ): Promise<void> {
    try {
      const { eventId } = data;
      this.leaveRoom(socket);
      const decreaseCounter = this.redisClient.decr(
        `event-${eventId}:clientsNetworkRoomCounter`,
      );
      const getAvailableRoom = this.service.getAvailableRoom();
      const [availableRoom] = await Promise.all([
        getAvailableRoom,
        decreaseCounter,
      ]);
      if (availableRoom) socket.emit(`AvailableRoom`, availableRoom);
      else socket.emit(`AvailableRoom`, false);
    } catch (error) {
      catchError(error);
    }
  }

  @SubscribeMessage('requestAvailableRoom')
  async switchRoom(socket: any, data: { currentRoom: string }): Promise<void> {
    try {
      const { currentRoom } = data;
      this.leaveRoom(socket);
      const { uniqueName: newRoom } = await this.service.getAvailableRoom(
        currentRoom,
      );
      if (newRoom) socket.emit(`switchRoom`, newRoom);
      else socket.emit(`switchRoom`, false);
    } catch (error) {
      catchError(error);
    }
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(socket: any, data: { eventId: number }): Promise<void> {
    try {
      msleep(50);
      const { eventId } = data;
      this.redlock
        .lock(`event-${eventId}:locks:clientsNetworkRoomCounter`, 3000)
        .then(async lock => {
          const incrementCounter = this.incrementCounter(eventId);
          const bindSocketToRoom = this.bindSocketToRoom(socket, eventId);
          const [counter] = await Promise.all([
            incrementCounter,
            bindSocketToRoom,
          ]);
          await this.send(+counter, eventId);
          return lock.unlock().catch(catchError);
        });
    } catch (error) {
      catchError(error);
    }
  }

  async bindSocketToRoom(socket: any, eventId: number): Promise<void> {
    try {
      const lastRoom =
        +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
      socket.join(`event-${eventId}:room-${lastRoom}`);
    } catch (error) {
      catchError(error);
    }
  }

  async send(counter: number, eventId: number): Promise<void> {
    try {
      if (counter % 3 === 0) await this.sendTwillioRoomToSockets(eventId);
    } catch (error) {
      catchError(error);
    }
  }

  async sendTwillioRoomToSockets(eventId: number): Promise<void> {
    try {
      const getLastRoom = this.redisClient.get(`event-${eventId}:lastRoom`);
      const getNewTwillioRoom = this.getNewTwillioRoom(eventId);
      const incrementLastRoom = this.redisClient.incr(
        `event-${eventId}:lastRoom`,
      );
      const [lastRoom, newTwillioRoom] = await Promise.all([
        getLastRoom,
        getNewTwillioRoom,
        incrementLastRoom,
      ]);
      this.server.to(`event-${eventId}:room-${+lastRoom}`).emit(newTwillioRoom);
      console.log(`${newTwillioRoom}/${process.pid}/${+lastRoom}`);
    } catch (error) {
      catchError(error);
    }
  }

  async incrementCounter(eventId: number): Promise<number | void> {
    try {
      await this.redisClient.incr(`event-${eventId}:clientsNetworkRoomCounter`);
      return await this.redisClient.get(
        `event-${eventId}:clientsNetworkRoomCounter`,
      );
    } catch (error) {
      return catchError(error);
    }
  }

  async getNewTwillioRoom(eventId: number): Promise<string | void> {
    try {
      await this.requestToCreateNewRooms(eventId);
      const newRoom = await this.redisClient.lpop(`event-${eventId}:rooms`);
      let fallbackRoom;
      if (!newRoom) fallbackRoom = (await this.service.createRoom()).uniqueName;
      return newRoom || fallbackRoom;
    } catch (error) {
      return catchError(error);
    }
  }

  async requestToCreateNewRooms(eventId: number): Promise<void> {
    try {
      const roomsLength = +(await this.redisClient.llen(
        `event-${eventId}:rooms`,
      ));
      if (roomsLength < 8) {
        await this.networkRoomQueue.add(
          'createRooms',
          { eventId, isRepeat: true },
          { priority: 1, removeOnComplete: true },
        );
        this.clearExpiredTwillioRooms(eventId);
        msleep(500);
      }
    } catch (error) {
      catchError(error);
    }
  }

  clearExpiredTwillioRooms(eventId: number): void {
    setTimeout(async () => {
      await this.redisClient.del(`event-${eventId}:rooms`).catch(catchError);
    }, 258000);
  }

  leaveRoom(socket: any): void {
    try {
      const formerRoom: string | undefined = socket.rooms[1];
      formerRoom && socket.leaveRoom(formerRoom);
    } catch (error) {
      catchError(error);
    }
  }
}
