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

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'chat', transports: ['websocket'] })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly service: ChatService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleDisconnect(socket: any) {
    await this.redisClient.hdel('connectedUsersChat', socket.userId);
  }

  async handleConnection(socket: any) {
    try {
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
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
    const to = await this.redisClient.hget('connectedUsersChat', toUserGuid);
    const messageGuid = await this.service.create(
      eventId,
      sponsorGuid,
      toUserGuid,
      socket.userId,
    );
    this.server.to(to).emit('receiveMessage', {
      messageGuid,
      message,
      fromUserName,
      fromUserGuid: socket.userId,
    });
  }

  @SubscribeMessage('messageRead')
  async messageRead(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: ReadMessageDto,
  ): Promise<void> {
    const { toUserGuid, messageGuid } = data;
    const to = await this.redisClient.hget('connectedUsersChat', toUserGuid);
    await this.service.setReadMessage(messageGuid);
    this.server.to(to).emit('messageRead', {
      messageGuid,
    });
  }
}
