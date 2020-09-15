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
import { promisify } from 'util';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import * as Lock from 'redis-lock';
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

  private readonly lock: any;

  constructor(
    @InjectQueue('networkRoom')
    private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly service: NetworkRoomService,
    private readonly jwtService: JwtService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
    this.lock = promisify(Lock(this.redisClient));
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

    networkEventEmitter.on('SwitchRoom', async eventId => {
      const lengthSwitch = await this.redisClient.llen(
        `event-${eventId}:queueSwitch`,
      );
      if (lengthSwitch)
        await this.networkRoomQueue.add('switchRoom', { eventId });
    });

    networkEventEmitter.on('changedQueuesOrRooms', async eventId => {
      const length = await this.redisClient.llen(`event-${eventId}:queue`);
      if (length)
        await this.networkRoomQueue.add('findAvailableRooms', { eventId });
    });
  }

  async handleDisconnect(socket: any) {
    if (socket.eventId) {
      await this.redisClient.lrem(
        `event-${socket.eventId}:queue`,
        0,
        socket.id,
      );
      await this.redisClient.lrem(
        `event-${socket.eventId}:queueSwitch`,
        0,
        socket.id,
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
      socket.disconnect();
    }
  }

  @SubscribeMessage('switchRoom')
  async switchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomSwitchRoomDto,
  ): Promise<void> {
    const unlock = await this.lock('requestRoom');
    try {
      const { currentRoom, eventId } = data;
      await this.redisClient.lrem(`event-${eventId}:queueSwitch`, 0, socket.id);
      await this.redisClient.rpush(
        `event-${eventId}:queueSwitch`,
        JSON.stringify({ socketId: socket.id, currentRoom }),
      );
      networkEventEmitter.emit('SwitchRoom', eventId);
    } catch (error) {
      this.loggerService.error(`switchRoom: ${JSON.stringify(error)}`, error);
    } finally {
      unlock();
    }
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const unlock = await this.lock('requestRoom');
    try {
      const { eventId } = data;
      socket.eventId = eventId;
      await this.redisClient.lrem(`event-${eventId}:queue`, 0, socket.id);
      await this.redisClient.rpush(`event-${eventId}:queue`, socket.id);
      networkEventEmitter.emit('changedQueuesOrRooms', eventId);
    } catch (error) {
      this.loggerService.error(`requestRoom: ${JSON.stringify(error)}`, error);
    } finally {
      unlock();
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

  @SubscribeMessage('cancelRequest')
  async cancelRequest(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    await this.redisClient.lrem(`event-${eventId}:queue`, 0, socket.id);
    await this.redisClient.lrem(`event-${eventId}:queueSwitch`, 0, socket.id);
  }
}
