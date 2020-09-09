import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomRoomStatusDto } from './dto/networkRoomRoomStatus.dto';
import { NetworkRoomService } from './networkRoom.service';

@ApiTags('NetworkRoom')
@Controller('NetworkRoom')
export class NetworkRoomController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly service: NetworkRoomService,
  ) {
    super();
  }

  @Post('room-status')
  async statusCallback(
    @Body() networkRoomRoomStatusDto: NetworkRoomRoomStatusDto,
  ): Promise<void | ObjectLiteral> {
    await this.service.roomStatus(networkRoomRoomStatusDto);
  }
}
