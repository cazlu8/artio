import { Controller, Header, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';

@ApiTags('NetworkRoom')
@Controller('networkroom')
export class NetworkRoomController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly service: NetworkRoomService,
  ) {
    super();
  }

  @Header('Content-Type', 'application/x-www-urlencoded')
  @Post('roomStatus')
  async statusCallback(
    @Query('StatusCallbackEvent') StatusCallbackEvent: string,
    @Query('RoomName') RoomName: string,
  ): Promise<void | ObjectLiteral> {
    await this.service.roomStatus(StatusCallbackEvent, RoomName);
  }
}
