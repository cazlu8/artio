import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';
import { NetworkRoomRoomStatusDto } from './dto/networkRoomRoomStatus.dto';

@ApiTags('NetworkRoom')
@Controller('networkroom')
export class NetworkRoomController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly service: NetworkRoomService,
  ) {
    super();
  }

  @Post('roomStatus')
  async statusCallback(
    @Body() data: NetworkRoomRoomStatusDto,
  ): Promise<void | ObjectLiteral> {
    await this.service.roomStatus(data);
  }
}
