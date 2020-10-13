import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as bluebird from 'bluebird';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from 'nestjs-redis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import EventConnectToLiveEventDto from './dto/event.connectToLiveEvent.dto';
import BaseGateway from '../../shared/gateways/base.gateway';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'event', transports: ['websocket'] })
export class EventGateway extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    super();
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleDisconnect(socket: any) {
    if (socket.eventId) {
      const { eventId } = socket;
      await this.removeFromHashList(
        this.redisClient,
        `event-${eventId}:attendees`,
        eventId,
        socket.id,
      );
      await this.eventQueue.add('changeViewersCounter', {
        eventId,
        mod: 'decr',
      });
    }
    if (socket.adminEventId) {
      const { adminEventId } = socket;
      await this.removeFromHashList(
        this.redisClient,
        `event-${adminEventId}:admins`,
        adminEventId,
        socket.id,
      );
      await this.eventQueue.add('changeViewersCounter', {
        eventId: adminEventId,
        mod: 'decr',
      });
    }
    await this.redisClient.srem(
      'connectedUsersEvents',
      `${socket.id}--${socket.userId}`,
    );
  }

  async handleConnection(socket: any) {
    try {
      const { token, isAdmin, eventId } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
      if (isAdmin) {
        socket.adminEventId = eventId;
        await this.addToHashList(
          this.redisClient,
          `event-${eventId}:admins`,
          eventId,
          socket.id,
        );
      }
      await this.redisClient.sadd(
        'connectedUsersEvents',
        `${socket.id}--${socket.userId}`,
      );
    } catch (err) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('connectToLive')
  async connectToLive(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: EventConnectToLiveEventDto,
  ): Promise<void> {
    const { eventId } = data;
    socket.eventId = eventId;
    await this.addToHashList(
      this.redisClient,
      `event-${eventId}:attendees`,
      eventId,
      socket.id,
    );
    await this.eventQueue.add('changeViewersCounter', { eventId, mod: 'incr' });
  }

  @SubscribeMessage('disconnectToLive')
  async disconnectToLive(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: EventConnectToLiveEventDto,
  ): Promise<void> {
    const { eventId } = data;
    await this.eventQueue.add('changeViewersCounter', { eventId, mod: 'decr' });
  }
}
