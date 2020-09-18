import {
  Query,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { CardWalletRepository } from './cardWallet.repository';
import { BaseController } from '../../shared/controllers/base.controller';

@ApiTags('CardWallet')
@Controller('cardwallet')
export class CardWalletController extends BaseController {
  constructor(private readonly repository: CardWalletRepository) {
    super();
  }

  @Get('/:userId')
  async getCardsFromUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req,
  ): Promise<void | ObjectLiteral> {
    return this.repository.getCardsFromUser(
      userId,
      req.query.userName,
      +req.query.eventId,
    );
  }
}
