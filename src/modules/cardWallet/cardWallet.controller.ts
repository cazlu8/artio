import { Query, Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseController } from '../../shared/controllers/base.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { CardWalletRepository } from './cardWallet.repository';

@ApiTags('CardWalltet')
@Controller('cardwallet')
export class CardWalletController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly repository: CardWalletRepository,
  ) {
    super();
  }

  @Get('/:userId')
  async statusCallback(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('eventId', ParseIntPipe) eventId: number,
    @Query('userName') userName: string,
  ): Promise<void | ObjectLiteral> {
    return await this.repository.getCardsFromUser(userId, userName, eventId);
  }
}
