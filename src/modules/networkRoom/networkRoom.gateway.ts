import {
  BaseWsExceptionFilter,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import * as sleep from 'sleep';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { catchErrorWs } from '../../shared/utils/errorHandler.utils';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { transports: ['websocket'], upgrade: false })
export class NetworkRoomGateway {
  @WebSocketServer()
  readonly server: any;

  private readonly redisClient: any;

  private readonly redlock: any;

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
    this.redlock.on('clientError', catchErrorWs);
  }

  @SubscribeMessage('requestAvailableRoom')
  async requestAvailableRoom(
    socket: any,
    data: { eventId: number },
  ): Promise<void> {
    const { eventId } = data;
    this.leaveRoom(socket);
    const availableRoom = await this.service.getAvailableRoom();
    if (availableRoom?.uniqueName) {
      socket.emit(`requestAvailableRoom`, availableRoom);
      console.log(`requestAvailableRoom`, availableRoom);
    } else {
      await this.redisClient.decr(`event-${eventId}:clientsNetworkRoomCounter`);
      socket.emit(`requestAvailableRoom`, false);
    }
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(socket: any, data: { currentRoom: string }): Promise<void> {
    const { currentRoom } = data;
    this.leaveRoom(socket);
    const newRoom = await this.service.getAvailableRoom(currentRoom);
    if (newRoom?.uniqueName) socket.emit(`switchRoom`, newRoom);
    else socket.emit(`switchRoom`, false);
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(socket: any, data: { eventId: number }): Promise<void> {
    sleep.msleep(100);
    if (this.preventRepeatedSocket(socket)) return;
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
        return lock.unlock().catch(catchErrorWs);
      });
  }

  @SubscribeMessage('requestRoomToken')
  requestRoomToken(socket: any, data: NetworkRoomTokenDto): void {
    console.log(`requestRoomToken`, data);
    const token = this.service.videoToken(data);
    socket.emit('requestRoomToken', token);
  }

  @SubscribeMessage('leaveRoom')
  leaveRoomTwillio(socket: any): void {
    this.leaveRoom(socket);
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
    const [lastRoom, newTwillioRoom] = await Promise.all([
      getLastRoom,
      getNewTwillioRoom,
      incrementLastRoom,
    ]);
    this.server
      .to(`event-${eventId}:room-${+lastRoom}`)
      .emit('requestRoom', newTwillioRoom);
    console.log(`${newTwillioRoom.uniqueName}/${process.pid}/${+lastRoom}`);
  }

  async incrementCounter(eventId: number): Promise<number | void> {
    await this.redisClient.incr(`event-${eventId}:clientsNetworkRoomCounter`);
    return await this.redisClient.get(
      `event-${eventId}:clientsNetworkRoomCounter`,
    );
  }

  async getNewTwillioRoom(eventId: number): Promise<{ uniqueName: string }> {
    await this.requestToCreateNewRooms(eventId);
    const newRoom = JSON.parse(
      await this.redisClient.lpop(`event-${eventId}:rooms`),
    );
    return newRoom || (await this.createRoom());
  }

  private async requestToCreateNewRooms(eventId: number): Promise<void> {
    const roomsLength = +(await this.redisClient.llen(
      `event-${eventId}:rooms`,
    ));
    if (roomsLength < 12) {
      await this.service.addCreateRoomOnQueue(eventId, true);
    }
  }

  private leaveRoom(socket: any): void {
    const formerRoom: string | undefined = socket.rooms[1];
    formerRoom && socket.leaveRoom(formerRoom);
  }

  createRoom() {
    return this.service
      .createRoom()
      .then(data => data)
      .catch(() => Promise.resolve(this.createRoom()));
  }

  private preventRepeatedSocket(socket: any): boolean {
    const roomsArray = Object.keys(socket.rooms);
    return roomsArray.length === 2;
  }
}
