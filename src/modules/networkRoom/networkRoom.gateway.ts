import {
  BaseWsExceptionFilter,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import { NetworkRoomEventDefaultDto } from './dto/networkRoomEventDefault.dto';
import { NetworkRoomSwitchRoomDto } from './dto/networkRoomSwitchRoom.dto';
import networkEventEmitter from './networkRoom.event';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, {
  namespace: 'networkRoom',
  transports: ['websocket'],
})
export class NetworkRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  readonly server: any;

  private readonly redisClient: any;

  private readonly redlock: any;

  constructor(
    @InjectQueue('networkRoom')
    private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly service: NetworkRoomService,
    private readonly jwtService: JwtService,
  ) {
    this.redisClient = bluebird.promisifyAll(
      this.redisService.getClient('default'),
    );
    this.redlock = new Redlock([this.redisClient], {
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', err =>
      this.loggerService.error('redlockError: clientError', err),
    );
  }

  afterInit() {
    networkEventEmitter.on('sendAvailableRoom', async data => {
      const { socketId, room } = data;
      this.server.to(socketId).emit('requestRoom', room);
    });

    networkEventEmitter.on('sendSwitchRoom', async data => {
      const { socketId, room } = data;
      this.server.to(socketId).emit('switchRoom', room);
    });

    networkEventEmitter.on('changedQueuesOrRooms', async key => {
      const lock = await this.redlock.lock(`locks:${key}`, 2000);
      const eventId = +String.prototype.split.call(key.split(`:`)[0], `-`)[1];
      const length = await this.redisClient.llen(`event-${eventId}:queue`);
      if (length)
        await this.networkRoomQueue.add('findAvailableRooms', { eventId });
      const updatedLock = await lock.extend(1000);
      await updatedLock.unlock();
    });
  }

  async handleDisconnect(socket: any) {
    if (socket.eventId)
      await this.redisClient.lrem(
        `event-${socket.eventId}:queue`,
        0,
        socket.id,
      );
  }

  async handleConnection(@ConnectedSocket() socket: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') return;
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
    } catch (err) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomSwitchRoomDto,
  ): Promise<void> {
    const { currentRoom, eventId } = data;
    try {
      if (
        await this.redisClient.lindex(`event-${eventId}:queueSwitch`, socket.id)
      )
        return;
    } catch (err) {
      await this.redisClient.rpush(
        `event-${eventId}:queueSwitch`,
        JSON.stringify({ socketId: socket.id, currentRoom }),
      );
      networkEventEmitter.emit(
        'changedQueuesOrRooms',
        `event-${eventId}:queueSwitch`,
      );
    }
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    socket.eventId = eventId;
    try {
      if (await this.redisClient.lindex(`event-${eventId}:queue`, socket.id))
        return;
    } catch (err) {
      await this.redisClient.rpush(`event-${eventId}:queue`, socket.id);
      networkEventEmitter.emit(
        'changedQueuesOrRooms',
        `event-${eventId}:queue`,
      );
    }
  }

  @SubscribeMessage('requestRoomToken')
  requestRoomToken(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomTokenDto,
  ): void {
    const token = this.service.videoToken(data);
    this.server.to(socket.id).emit('requestRoomToken', token);
  }
}
