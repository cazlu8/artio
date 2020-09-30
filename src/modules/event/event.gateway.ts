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
import { EventService } from './event.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import EventConnectToLiveEventDto from './dto/event.connectToLiveEvent.dto';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'event', transports: ['websocket'] })
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleDisconnect(socket: any) {
    const { adminEventId, userId } = socket;
    if (adminEventId) {
      await this.removeAdminUserOfCache(adminEventId, userId);
      await this.eventQueue.add('changeViewersCounter', {
        eventId: adminEventId,
        mod: 'decr',
      });
    }
    await this.redisClient.srem(
      'connectedUsersEvents',
      `${socket.id}-${socket.userId}`,
    );
  }

  async handleConnection(socket: any) {
    try {
      const { token, isAdmin, eventId } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
      await this.addAdminUsersToCache(socket, eventId, isAdmin);
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

  private async addAdminUsersToCache(
    socket: any,
    eventId: number,
    isAdmin: boolean,
  ) {
    if (isAdmin && eventId) socket.adminEventId = eventId;
    if (isAdmin) {
      const currentValues = JSON.parse(
        await this.redisClient.hget(`event-${eventId}:admins`),
      );
      if (currentValues) {
        await this.redisClient.hset(
          `event-${eventId}:admins`,
          JSON.stringify(currentValues.concat(socket.userId)),
        );
      } else
        await this.redisClient.hset(
          `event-${eventId}:admins`,
          JSON.stringify([socket.userId]),
        );
    }
  }

  private async removeAdminUserOfCache(eventId: number, userId: string) {
    const currentValues = JSON.parse(
      await this.redisClient.hget(`event-${eventId}:admins`),
    );
    const newValues = currentValues.filter(x => x !== userId);
    await this.redisClient.hset(
      `event-${eventId}:admins`,
      JSON.stringify(newValues),
    );
  }
}
