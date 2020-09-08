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

  private readonly redisClientSubscriber: any;

  private readonly redlock: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly service: NetworkRoomService,
    private readonly jwtService: JwtService,
  ) {
    this.redisClientSubscriber = this.redisService.getClient('subscriber');
    this.redisClient = bluebird.promisifyAll(
      this.redisService.getClient('default'),
    );
    this.redisClientSubscriber.config('set', 'notify-keyspace-events', 'KEA');
    this.redisClientSubscriber.subscribe('__keyevent@0__:zadd');
    this.redisClientSubscriber.subscribe('__keyevent@0__:rpush');
    this.redisClientSubscriber.subscribe('__keyevent@0__:zincr');
    this.redisClientSubscriber.subscribe('__keyevent@0__:lpop');
    this.redisClientSubscriber.subscribe('__keyevent@0__:del');
    this.redlock = new Redlock([this.redisClient], {
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', err =>
      this.loggerService.error('redlockError: clientError', err),
    );
  }

  afterInit() {
    this.redisClientSubscriber.on('message', async (channel, key) => {
      if (key.includes('bull')) return;
      if (channel === 'sendAvailableRoom') {
        const { socketId, room, isSwitch } = JSON.parse(key);
        if (isSwitch === true)
          this.server.to(socketId).emit('switchRoom', room);
        this.server.to(socketId).emit('requestRoom', room);
      }
      if (key.includes('queue') || key.includes('rooms')) {
        const lock = await this.redlock.lock(`locks:${key}`, 4000);
        const eventId = +String.prototype.split.call(key.split(`:`)[0], `-`)[1];
        const length = await this.redisClient.llen(`event-${eventId}:queue`);
        if (length)
          await this.networkRoomQueue.add('findAvailableRooms', { eventId });
        const updatedLock = await lock.extend(1000);
        await updatedLock.unlock();
      }
    });
    this.redisClientSubscriber.subscribe('sendAvailableRoom');
  }

  async handleDisconnect(socket: any) {
    if (socket.eventId)
      await this.redisClient.lrem(
        `event-${socket.eventId}:queue`,
        1,
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
    if (
      (await this.redisClient.lpos(
        `event-${eventId}:queueSwitch`,
        socket.id,
      )) === null
    )
      await this.redisClient.rpush(
        `event-${eventId}:queueSwitch`,
        JSON.stringify({ socketId: socket.id, currentRoom }),
      );
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    socket.eventId = eventId;
    if (
      (await this.redisClient.lpos(`event-${eventId}:queue`, socket.id)) ===
      null
    )
      await this.redisClient.rpush(`event-${eventId}:queue`, socket.id);
  }

  @SubscribeMessage('requestRoomToken')
  requestRoomToken(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomTokenDto,
  ): void {
    const token = this.service.videoToken(data);
    this.server.to(socket.id).emit('requestRoomToken', token);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoomTwillio(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    await this.redisClient.lrem(`event-${eventId}:queue`, 1, socket.id);
  }
}
