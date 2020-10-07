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
import SendMessageDto from './dto/chat.sendMessage.dto';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import ReadMessageDto from './dto/chat.readMessage.dto';
import { ChatService } from './chat.service';
import BaseGateway from '../../shared/gateways/base.gateway';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'chat', transports: ['websocket'] })
export class ChatGateway extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly service: ChatService,
    @InjectQueue('chat') private readonly chatQueue: Queue,
  ) {
    super();
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleDisconnect(socket: any) {
    if (socket.sponsorGuid) {
      await this.removeFromHashList(
        this.redisClient,
        `connectedUsersChat`,
        socket.sponsorGuid,
        socket.id,
      );
    } else await this.redisClient.hdel('connectedUsersChat', socket.userId);
  }

  async handleConnection(socket: any) {
    try {
      const { token, isSponsor, sponsorGuid } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
      socket.sponsorGuid = sponsorGuid;
      if (isSponsor) {
        await this.addToHashList(
          this.redisClient,
          `connectedUsersChat`,
          sponsorGuid,
          socket.id,
        );
      } else
        await this.redisClient.hset(
          'connectedUsersChat',
          socket.userId,
          socket.id,
        );
    } catch (err) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('message')
  async message(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: SendMessageDto,
  ): Promise<void> {
    const { eventId, sponsorGuid, toUserGuid, fromUserName, message } = data;
    const messageGuid = await this.service.create(
      eventId,
      sponsorGuid,
      toUserGuid,
      socket.userId,
    );
    if (!socket.sponsorGuid) {
      await this.chatQueue.add(`sendMessageToSponsor`, {
        params: {
          message,
          messageGuid,
          fromUserName,
          sponsorGuid,
          fromUserGuid: socket.userId,
        },
        eventName: `receiveMessage`,
      });
    } else {
      const to = await this.redisClient.hget(`connectedUsersChat`, toUserGuid);
      this.server.to(to).emit('receiveMessage', {
        messageGuid,
        message,
        fromUserName,
        fromUserGuid: socket.userId,
      });
    }
  }

  @SubscribeMessage('messageRead')
  async messageRead(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: ReadMessageDto,
  ): Promise<void> {
    const { toUserGuid, sponsorGuid, messageGuid } = data;
    await this.service.setReadMessage(messageGuid);
    if (!socket.sponsorGuid) {
      await this.chatQueue.add(`sendMessageToSponsor`, {
        params: {
          messageGuid,
        },
        sponsorGuid,
        eventName: `messageRead`,
      });
    } else {
      const to = await this.redisClient.hget('connectedUsersChat', toUserGuid);
      this.server.to(to).emit('messageRead', {
        messageGuid,
      });
    }
  }
}
