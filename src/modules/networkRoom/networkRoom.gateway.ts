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
import { NetworkRoomEventDefaultDto } from './dto/networkRoomEventDefault.dto';
import { NetworkRoomSwitchRoomDto } from './dto/networkRoomSwitchRoom.dto';
import { NetworkRoomRequestAvailableRoomDto } from './dto/NetworkRoomRequestAvailableRoom.dto';
import { NetworkRoomRRDto } from './dto/networkRoomRR';

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
  async requestAvailableRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe())
    data: NetworkRoomRequestAvailableRoomDto,
  ): Promise<void> {
    const { eventId } = data;
    const { userId } = socket;
    const alreadyRequestARoom = await this.redisClient.get(userId);
    await this.redisClient.set(`event-${eventId}:availableRoom`, 1);
    if (alreadyRequestARoom) {
      this.redlock
        .lock(`locks:event-${eventId}:availableRoom`, 4000)
        .then(async lock => {
          this.leaveRoom(socket);
          const availableRoom = await this.service.getAvailableRoom();
          if (availableRoom?.uniqueName) {
            socket.emit(`requestAvailableRoom`, availableRoom);
            console.log(`request AvailableRoom`, availableRoom);
          } else {
            socket.emit(`requestAvailableRoom`, false);
          }
          lock.extend(2000).then(async extendLock => {
            extendLock.unlock();
            await this.redisClient.del(`event-${eventId}:availableRoom`);
          });
        });
    } else socket.emit(`requestAvailableRoom`, false);
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomSwitchRoomDto,
  ): Promise<void> {
    const { currentRoom, eventId } = data;
    const { userId } = socket;
    const alreadyRequestARoom = await this.redisClient.get(userId);
    await this.redisClient.set(`event-${eventId}:switchRoom`, 1);
    if (alreadyRequestARoom) {
      this.redlock
        .lock(`locks:event-${eventId}:switchRoom`, 5000)
        .then(async lock => {
          this.leaveRoom(socket);
          const newRoom = await this.service.getAvailableRoom(currentRoom);
          if (newRoom?.uniqueName) socket.emit(`switchRoom`, newRoom);
          else socket.emit(`switchRoom`, false);
          lock.unlock().catch(catchErrorWs);
          await this.redisClient.del(`event-${eventId}:switchRoom`);
        });
    }
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomRRDto,
  ): Promise<void> {
    console.log('requestRoom', data);
    const { eventId } = data;
    const { userId } = socket;
    if (await this.preventRequestRoom(userId)) return;
    this.redlock
      .lock(`locks:event-${eventId}:clientsNetworkRoomCounter`, 5000)
      .then(async lock => {
        const counter = await this.incrementCounter(eventId);
        await this.bindSocketToRoom(socket, eventId);
        console.log('foi counter', counter);
        await this.send(+counter, eventId);
        await this.redisClient.set(userId, 1, 'EX', 1000);
        lock.unlock().catch(catchErrorWs);
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
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { userId } = socket;
    console.log(data);
    const alreadyRequestARoom = await this.redisClient.get(userId);
    await this.redisClient.set(`event-${userId}:leaveRoom`, 1);
    if (alreadyRequestARoom) {
      this.redlock
        .lock(`locks:event-${userId}:leaveRoom`, 5000)
        .then(async lock => {
          await this.leaveRoom(socket);
          await this.removeRequestRoomLock(userId);
          lock.unlock().catch(catchErrorWs);
          await this.redisClient.del(`event-${userId}:leaveRoom`);
        });
    }
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
    console.log('sending message');
    const lastRoom = await this.redisClient.get(`event-${eventId}:lastRoom`);
    const newTwillioRoom = await this.getNewTwillioRoom(eventId);
    await this.redisClient.incr(`event-${eventId}:lastRoom`);
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
    console.log(`releasing user${userId}`);
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
