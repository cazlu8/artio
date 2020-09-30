import {
  BaseWsExceptionFilter,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as bluebird from 'bluebird';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from 'nestjs-redis';
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'user', transports: ['websocket'] })
export class UserGateway implements OnGatewayConnection {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleConnection(socket: any) {
    try {
      const { token, hash } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
      await this.redisClient.hset(
        'loggedUsers',
        socket.userId,
        `${socket.id}--${hash}`,
      );
    } catch (err) {
      socket.disconnect();
    }
  }

  async sendSignOutMessage(socketId: string) {
    await this.server.to(socketId).emit('signOut');
  }
}
