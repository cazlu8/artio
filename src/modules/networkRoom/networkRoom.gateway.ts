import {
  BaseWsExceptionFilter,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Server } from 'socket.io';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { catchErrorWs } from '../../shared/utils/errorHandler.utils';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import { NetworkRoomRequestRoomDto } from './dto/networkRoomRequestRoom.dto';
import { NetworkRoomSwitchRoomDto } from './dto/networkRoomSwitchRoom.dto';
import { NetworkRoomLeaveRoomDto } from './dto/networkRoomLeaveRoom.dto';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'networkRoom', transports: ['websocket'] })
export class NetworkRoomGateway implements OnGatewayConnection {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  private readonly redlock: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly service: NetworkRoomService,
    private readonly jwtService: JwtService,
  ) {
    this.redisClient = this.redisService.getClient();
    this.redlock = new Redlock([this.redisClient], {
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', catchErrorWs);
  }

  async handleConnection(socket: any): Promise<void> {
    try {
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
    } catch (err) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('requestAvailableRoom')
  async requestAvailableRoom(socket: any): Promise<void> {
    this.leaveRoom(socket);
    const availableRoom = await this.service.getAvailableRoom();
    if (availableRoom?.uniqueName) {
      socket.emit(`requestAvailableRoom`, availableRoom);
      console.log(`requestAvailableRoom`, availableRoom);
    } else {
      socket.emit(`requestAvailableRoom`, false);
    }
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomSwitchRoomDto,
  ): Promise<void> {
    const { currentRoom } = data;
    this.leaveRoom(socket);
    const newRoom = await this.service.getAvailableRoom(currentRoom);
    if (newRoom?.uniqueName) socket.emit(`switchRoom`, newRoom);
    else socket.emit(`switchRoom`, false);
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomRequestRoomDto,
  ): Promise<void> {
    console.log('requestRoom', data);
    const { eventId, userId } = data;
    if (await this.preventRequestRoom(userId)) return;
    this.redlock
      .lock(`event-${eventId}:locks:clientsNetworkRoomCounter`, 5000)
      .then(async lock => {
        const incrementCounter = this.incrementCounter(eventId);
        const bindSocketToRoom = this.bindSocketToRoom(socket, eventId);
        const [counter] = await Promise.all([
          incrementCounter,
          bindSocketToRoom,
        ]);
        await this.send(+counter, eventId);
        await this.redisClient.set(userId, 1, 'NX', 'EX', 600);
        return lock.unlock().catch(catchErrorWs);
      });
  }

  @SubscribeMessage('requestRoomToken')
  requestRoomToken(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomTokenDto,
  ): void {
    console.log(`requestRoomToken`, data);
    const token = this.service.videoToken(data);
    socket.emit('requestRoomToken', token);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoomTwillio(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomLeaveRoomDto,
  ): Promise<void> {
    await this.leaveRoom(socket);
    await this.removeRequestRoomLock(data.userId);
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
    const counter = await this.redisClient.get(
      `event-${eventId}:clientsNetworkRoomCounter`,
    );
    console.log(
      `${newTwillioRoom.uniqueName}/${process.pid}/${+lastRoom}/${counter}`,
    );
  }

  async incrementCounter(eventId: number): Promise<number | void> {
    await this.redisClient.incr(`event-${eventId}:clientsNetworkRoomCounter`);
    return await this.redisClient.get(
      `event-${eventId}:clientsNetworkRoomCounter`,
    );
  }

  async getNewTwillioRoom(eventId: number): Promise<{ uniqueName: string }> {
    await this.requestToCreateNewRooms(eventId);
    const newRoom = await this.redisClient.lpop(`event-${eventId}:rooms`);
    return newRoom ? { uniqueName: newRoom } : await this.createRoom();
  }

  private async requestToCreateNewRooms(eventId: number): Promise<void> {
    const roomsLength = +(await this.redisClient.llen(
      `event-${eventId}:rooms`,
    ));
    if (roomsLength < 4) {
      await this.service.addCreateRoomOnQueue(eventId, true);
    }
  }

  private leaveRoom(socket: any): void {
    const roomsArray: string[] = Object.keys(socket.rooms);
    const formerRoom: string = roomsArray[1];
    formerRoom && socket.leave(formerRoom);
  }

  private async removeRequestRoomLock(userId: number) {
    await this.redisClient.del(userId);
  }

  createRoom() {
    return this.service
      .createRoom()
      .then(({ uniqueName }) => ({ uniqueName }))
      .catch(() => Promise.resolve(this.createRoom()));
  }

  private async preventRequestRoom(userId: number): Promise<boolean> {
    return (await this.redisClient.get(userId)) !== null;
  }
}
