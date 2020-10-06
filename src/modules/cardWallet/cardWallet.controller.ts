import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { CardWalletRepository } from './cardWallet.repository';
import { BaseController } from '../../shared/controllers/base.controller';
import { Event } from '../event/event.entity';
import { ListUserEventDto } from '../userEvents/dto/userEvents.list.dto';
import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { CardWalletGuard } from './guards/cardWallet.guard';

@ApiTags('CardWalltet')
@Controller('cardwallet')
export class CardWalletController extends BaseController {
  constructor(private readonly repository: CardWalletRepository) {
    super();
  }

  @ApiParam({ name: 'userId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Get cards from user',
  })
  @UseGuards(VerifyIfIsAuthenticatedUserGuard)
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

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Delete card wallet',
  })
  @UseGuards(CardWalletGuard)
  @Delete('/:id')
  @HttpCode(204)
  @Header('Content-Length', '0')
  async deleteCard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void | ObjectLiteral> {
    return this.repository.delete({ id });
  }

  @ApiParam({ name: 'userId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id',
  })
  @UseGuards(VerifyIfIsAuthenticatedUserGuard)
  @Get('events/:userId')
  async getEventListByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ListUserEventDto[]> {
    return this.repository.getEventsFromUser(userId);
  }
}
