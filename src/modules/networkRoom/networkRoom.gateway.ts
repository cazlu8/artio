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

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, {
  namespace: 'networkRoom',
  transports: ['websocket'],
  origins: process.env.ALLOWED_ORIGINS,
})
export class NetworkRoomGateway implements OnGatewayConnection {
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
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', catchErrorWs);
  }

  async handleConnection(socket: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') return;
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
    this.redlock
      .lock(`locks:event-${eventId}:availableRoom`, 4000)
      .then(async lock => {
        const lastTwilioRoom = await this.redisClient.lpop(
          `event-${eventId}:currentTwilioRoom`,
        );
        if (lastTwilioRoom)
          socket.emit(`requestAvailableRoom`, {
            uniqueName: lastTwilioRoom,
          });
        else {
          const availableRoom = await this.service.getAvailableRoom();
          if (availableRoom?.uniqueName) {
            socket.emit(`requestAvailableRoom`, availableRoom);
            this.leaveRoom(socket);
            console.log(`request AvailableRoom`, availableRoom);
          } else {
            socket.emit(`requestAvailableRoom`, false);
          }
          lock.extend(4000).then(async extendLock => {
            await extendLock.unlock().catch(catchErrorWs);
          });
        }
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
        this.leaveRoom(socket);
        const newRoom = await this.service.getAvailableRoom(currentRoom);
        if (newRoom?.uniqueName) socket.emit(`switchRoom`, newRoom);
        else socket.emit(`switchRoom`, false);
        await lock.unlock().catch(catchErrorWs);
      });
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: NetworkRoomEventDefaultDto,
  ): Promise<void> {
    const { eventId } = data;
    this.redlock
      .lock(`locks:event-${eventId}:clientsNetworkRoomCounter`, 5000)
      .then(async lock => {
        this.leaveRoom(socket);
        await this.bindSocketToRoom(socket, eventId);
        const lastRoom =
          +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
        const { length } = this.server.adapter.rooms[
          `event-${eventId}:room-${+lastRoom}`
        ];
        if (length === 3) {
          const { uniqueName } = await this.send(eventId);
          await this.redisClient.rpush(
            `event-${eventId}:currentTwilioRoom`,
            uniqueName,
          );
        }
        await lock.unlock().catch(catchErrorWs);
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
    const { eventId } = data;
    this.redlock
      .lock(`locks:event-${eventId}:leaveRoom`, 2000)
      .then(async lock => {
        this.leaveRoom(socket);
        await lock.unlock().catch(catchErrorWs);
      });
  }

  async bindSocketToRoom(socket: any, eventId: number): Promise<void> {
    const lastRoom =
      +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
    this.server.adapter.remoteJoin(
      socket.id,
      `event-${eventId}:room-${lastRoom}`,
    );
  }

  async send(eventId: number): Promise<{ uniqueName: string }> {
    return await this.sendTwillioRoomToSockets(eventId);
  }

  async sendTwillioRoomToSockets(
    eventId: number,
  ): Promise<{ uniqueName: string }> {
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

  private leaveRoom(socket: any): void {
    const roomsArray: string[] = Object.keys(socket.rooms);
    const formerRoom: string = roomsArray[1];
    formerRoom && this.server.adapter.remoteLeave(socket.id, formerRoom);
  }

  createRoom() {
    return this.service
      .createRoom()
      .then(({ uniqueName }) => ({ uniqueName }))
      .catch(() => Promise.resolve(this.createRoom()));
  }
}
