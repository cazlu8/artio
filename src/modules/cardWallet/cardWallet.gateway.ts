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
import { WsAuthGuard } from '../../shared/guards/wsAuth.guard';
import { ErrorsInterceptor } from '../../shared/interceptors/errors.interceptor';
import { JwtService } from '../../shared/services/jwt.service';
import { ValidationSchemaWsPipe } from '../../shared/pipes/validationSchemaWs.pipe';
import { CardWalletRequestCardDto } from './dto/cardWalletRequestCard.dto';
import { CardWalletResponseCardDto } from './dto/cardWalletResponse.dto';
import { UserRepository } from '../user/user.repository';
import { CardWalletRepository } from './cardWallet.repository';
import { CardWalletService } from './cardWallet.service';

@UseGuards(WsAuthGuard)
@UseFilters(new BaseWsExceptionFilter())
@UseInterceptors(ErrorsInterceptor)
@WebSocketGateway(3030, { namespace: 'cardwallet', transports: ['websocket'] })
export class CardWalletGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly redisClient: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly service: CardWalletService,
    private readonly userRepository: UserRepository,
    private readonly repository: CardWalletRepository,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async handleDisconnect(socket: any) {
    await this.redisClient.hdel('connectedUsersCardWallet', socket.userId);
  }

  async handleConnection(socket: any) {
    try {
      const { token } = socket.handshake.query;
      const { sub } = await this.jwtService.validateToken(token);
      socket.userId = sub;
      await this.redisClient.hset(
        'connectedUsersCardWallet',
        socket.userId,
        socket.id,
      );
    } catch (err) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('requestCard')
  async requestCard(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: CardWalletRequestCardDto,
  ): Promise<void> {
    const { eventId, requestedUserGuid, requestingUserName } = data;
    const exists = await this.service.verifyIfRelationshipExists(
      eventId,
      socket.userId,
      requestedUserGuid,
    );
    if (exists) {
      const userCardData = await this.userRepository.getCardDataByGuid(
        requestedUserGuid,
      );
      this.server.to(socket.id).emit('responseCard', userCardData);
    } else {
      const requestedUserSocketId = await this.redisClient.hget(
        `connectedUsersCardWallet`,
        requestedUserGuid,
      );
      this.server.to(requestedUserSocketId).emit('askCard', {
        requestingUserName,
        requestingUserGuid: socket.userId,
      });
    }
  }

  @SubscribeMessage('responseCard')
  async responseCard(
    @ConnectedSocket() socket: any,
    @MessageBody(new ValidationSchemaWsPipe()) data: CardWalletResponseCardDto,
  ): Promise<void> {
    const { eventId, accept, requestingUserGuid } = data;
    const requestingUserSocketId = await this.redisClient.hget(
      'connectedUsersCardWallet',
      requestingUserGuid,
    );
    if (accept) {
      const [requestingUserId, requestedUserId] = await this.service.getUserIds(
        requestingUserGuid,
        socket.userId,
      );
      this.repository.save({
        eventId,
        requestingUserId,
        requestedUserId,
      });
      const userCardData = await this.userRepository.getCardDataByGuid(
        socket.userId,
      );
      this.server.to(requestingUserSocketId).emit('responseCard', userCardData);
    } else this.server.to(requestingUserSocketId).emit('responseCard', false);
  }
}
