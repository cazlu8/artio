import {
  BaseWsExceptionFilter,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import * as sleep from 'sleep';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import { NetworkRoomEventDefaultDto } from './dto/networkRoomEventDefault.dto';
import { NetworkRoomSwitchRoomDto } from './dto/networkRoomSwitchRoom.dto';
import { NetworkRoomRequestAvailableRoomDto } from './dto/NetworkRoomRequestAvailableRoom.dto';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, {
  namespace: 'networkRoom',
  transports: ['websocket'],
})
export class NetworkRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: any;

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
      retryDelay: 200,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', err =>
      this.loggerService.error('redlockError: clientError', err),
    );
  }

  async handleDisconnect(socket: any) {
    if (socket.userId && socket.eventId) {
      const { userId, id: socketId } = socket;
      await this.redisClient.srem(
        `event-${socket.eventId}:usersRequestedRoomUserId`,
        userId,
      );
      await this.redisClient.srem(
        `event-${socket.eventId}:usersRequestedRoomSocketId`,
        socketId,
      );
    }
  }

  async handleConnection(@ConnectedSocket() socket: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') return;
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
    } catch (err) {
      this.server.adapter.remoteDisconnect(socket.id, true);
    }
  }

  @SubscribeMessage('requestAvailableRoom')
  async requestAvailableRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe())
    data: NetworkRoomRequestAvailableRoomDto,
  ): Promise<void> {
    const { eventId } = data;
    this.redlock
      .lock(`locks:event-${eventId}:availableRoom`, 10000)
      .then(async lock => {
        sleep.msleep(1000);
        const lastTwilioRoom = await this.getLastTwilioRoom(eventId);
        if (lastTwilioRoom) {
          await this.leaveRoom(socket, eventId);
          socket.emit(`requestAvailableRoom`, {
            uniqueName: lastTwilioRoom,
          });
        } else {
          const availableRoom = await this.service.getAvailableRoom();
          const lastAvailableRoom = await this.getLastAvailableRoom(eventId);
          if (
            availableRoom?.uniqueName &&
            availableRoom?.uniqueName !== lastAvailableRoom
          ) {
            await this.leaveRoom(socket, eventId);
            await this.setLastAvailableRoom(eventId, availableRoom.uniqueName);
            socket.emit(`requestAvailableRoom`, availableRoom);
          } else {
            socket.emit(`requestAvailableRoom`, false);
          }
        }
        return await lock.unlock();
      });
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomSwitchRoomDto,
  ): Promise<void> {
    const { currentRoom, eventId } = data;
    this.redlock
      .lock(`locks:event-${eventId}:switchRoom`, 5000)
      .then(async lock => {
        await this.leaveRoom(socket, eventId);
        const newRoom = await this.service.getAvailableRoom(currentRoom);
        const lastSwitchRoom = await this.getLastSwitchRoom(eventId);
        if (newRoom?.uniqueName && newRoom?.uniqueName !== lastSwitchRoom) {
          await this.setLastSwitchRoom(eventId, newRoom.uniqueName);
          socket.emit(`switchRoom`, newRoom);
        } else socket.emit(`switchRoom`, false);
        return await lock.unlock();
      });
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    this.redlock
      .lock(`locks:event-${eventId}:requestRoom`, 5000)
      .then(async lock => {
        await this.bindSocketToRoom(socket, eventId);
        socket.eventId = eventId;
        const roomLength = await this.redisClient.scard(
          `event-${eventId}:usersRequestedRoomUserId`,
        );
        if (roomLength === 3) {
          const { uniqueName } = await this.send(eventId);
          await this.setLastTwilioRoom(eventId, uniqueName);
          await this.clearUserRequestRoom(eventId);
        }
        return await lock.unlock();
      });
  }

  @SubscribeMessage('requestRoomToken')
  requestRoomToken(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomTokenDto,
  ): void {
    const token = this.service.videoToken(data);
    socket.emit('requestRoomToken', token);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoomTwillio(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    this.redlock.lock(`locks:event-${eventId}`, 2000).then(async lock => {
      await this.leaveRoom(socket, eventId);
      return await lock.unlock();
    });
  }

  async bindSocketToRoom(socket: any, eventId: number): Promise<void> {
    const { userId, id: socketId } = socket;
    await this.redisClient.sadd(
      `event-${eventId}:usersRequestedRoomUserId`,
      userId,
    );
    await this.redisClient.sadd(
      `event-${eventId}:usersRequestedRoomSocketId`,
      socketId,
    );
  }

  async send(eventId: number): Promise<{ uniqueName: string }> {
    return await this.sendTwillioRoomToSockets(eventId);
  }

  async sendTwillioRoomToSockets(
    eventId: number,
  ): Promise<{ uniqueName: string }> {
    const newTwillioRoom = await this.getNewTwillioRoom(eventId);
    const socketIds = await this.redisClient.smembers(
      `event-${eventId}:usersRequestedRoomSocketId`,
    );
    socketIds?.forEach(id =>
      this.server.to(id).emit('requestRoom', newTwillioRoom),
    );
    this.loggerService.info(
      `ws:requestRoom: room ${
        newTwillioRoom.uniqueName
      } sent to sockets ${JSON.stringify(socketIds)} for the event ${eventId}`,
    );
    return newTwillioRoom;
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
    if (roomsLength < 8) {
      await this.service.addCreateRoomOnQueue(eventId, true);
    }
  }

  private async getLastTwilioRoom(eventId: number) {
    return await this.redisClient.lpop(`event-${eventId}:currentTwilioRoom`);
  }

  private async setLastTwilioRoom(eventId: number, uniqueName: string) {
    await this.redisClient.rpush(
      `event-${eventId}:currentTwilioRoom`,
      uniqueName,
    );
  }

  private async getLastAvailableRoom(eventId: number) {
    return (
      (await this.redisClient.get(`event-${eventId}:lastAvailableRoom`)) || ''
    );
  }

  private async setLastAvailableRoom(eventId: number, uniqueName: string) {
    await this.redisClient.set(
      `event-${eventId}:lastAvailableRoom`,
      uniqueName,
      'EX',
      15,
    );
  }

  private async getLastSwitchRoom(eventId: number) {
    return (
      (await this.redisClient.get(`event-${eventId}:lastSwitchRoom`)) || ''
    );
  }

  private async setLastSwitchRoom(eventId: number, uniqueName: string) {
    await this.redisClient.set(
      `event-${eventId}:lastSwitchRoom`,
      uniqueName,
      'EX',
      15,
    );
  }

  private async leaveRoom(socket: any, eventId: number): Promise<void> {
    const { userId, id: socketId } = socket;
    await this.redisClient.srem(
      `event-${eventId}:usersRequestedRoomUserId`,
      userId,
    );
    await this.redisClient.srem(
      `event-${eventId}:usersRequestedRoomSocketId`,
      socketId,
    );
  }

  private async clearUserRequestRoom(eventId: number) {
    await this.redisClient.del(`event-${eventId}:usersRequestedRoomUserId`);
    await this.redisClient.del(`event-${eventId}:usersRequestedRoomSocketId`);
  }

  createRoom() {
    return this.service
      .createRoom()
      .then(({ uniqueName }) => ({ uniqueName }))
      .catch(() => Promise.resolve(this.createRoom()));
  }
}
