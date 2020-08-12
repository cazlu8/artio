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
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', catchErrorWs);
  }

  async handleDisconnect(@ConnectedSocket() socket: any) {
    if (socket.userId) {
      await this.redisClient.del(`users:${socket.userId}`);
    }
  }

  async handleConnection(@ConnectedSocket() socket: any): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') return;
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      const canConnect = await this.redisClient.set(
        `users:${sub}`,
        socket.id,
        'NX',
        'EX',
        30,
      );
      if (!canConnect) {
        this.server.adapter.remoteDisconnect(socket.id, true);
        return;
      }
      socket.userId = sub;
      socket.conn.on('packet', async packet => {
        if (socket.userId && packet.type === 'ping') {
          await this.redisClient.set(
            `users:${socket.userId}`,
            socket.id,
            'XX',
            'EX',
            30,
          );
        }
      });
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
      .lock(`locks:event-${eventId}:availableRoom`, 3000)
      .then(async lock => {
        const lastTwilioRoom = await this.getLastTwilioRoom(eventId);
        if (lastTwilioRoom) {
          await this.leaveRoom(socket);
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
            await this.leaveRoom(socket);
            await this.setLastAvailableRoom(eventId, availableRoom.uniqueName);
            socket.emit(`requestAvailableRoom`, availableRoom);
            console.log(`request AvailableRoom`, availableRoom);
          } else {
            socket.emit(`requestAvailableRoom`, false);
          }
          await lock.unlock().catch(catchErrorWs);
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
        await this.leaveRoom(socket);
        const newRoom = await this.service.getAvailableRoom(currentRoom);
        const lastSwitchRoom = await this.getLastSwitchRoom(eventId);
        if (newRoom?.uniqueName && newRoom?.uniqueName !== lastSwitchRoom) {
          await this.setLastSwitchRoom(eventId, newRoom.uniqueName);
          socket.emit(`switchRoom`, newRoom);
        } else socket.emit(`switchRoom`, false);
        return await lock.unlock().catch(catchErrorWs);
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
        const lastRoom =
          +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
        const room = this.server.adapter.rooms[
          `event-${eventId}:room-${+lastRoom}`
        ];
        console.log(room?.length);
        if (room?.length === 3) {
          console.log('room', room);
          const { uniqueName } = await this.send(eventId);
          await this.setLastTwilioRoom(eventId, uniqueName);
        }
        return await lock.unlock().catch(catchErrorWs);
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
    this.redlock.lock(`locks:event-${eventId}`, 2000).then(async lock => {
      await this.leaveRoom(socket);
      return await lock.unlock().catch(catchErrorWs);
    });
  }

  async bindSocketToRoom(socket: any, eventId: number): Promise<void> {
    const lastRoom =
      +(await this.redisClient.get(`event-${eventId}:lastRoom`)) || 0;
    return new Promise((resolve, reject) => {
      this.server.adapter.remoteJoin(
        socket.id,
        `event-${eventId}:room-${lastRoom}`,
        err => (err ? reject() : resolve()),
      );
    });
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

  private leaveRoom(socket: any): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const roomsArray: string[] = Object.keys(socket.rooms);
      const formerRoom: string = roomsArray[1];
      if (formerRoom)
        this.server.adapter.remoteLeave(socket.id, formerRoom, err =>
          err ? reject(err) : resolve(),
        );
      else resolve();
    });
  }

  createRoom() {
    return this.service
      .createRoom()
      .then(({ uniqueName }) => ({ uniqueName }))
      .catch(() => Promise.resolve(this.createRoom()));
  }
}
