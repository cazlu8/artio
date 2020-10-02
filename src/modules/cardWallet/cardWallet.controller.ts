import {
  Controller,
  Delete,
  Get,
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
import { AuthGuard } from '../../shared/guards/auth.guard';
import { ListUserEventDto } from '../userEvents/dto/userEvents.list.dto';

@ApiTags('CardWalltet')
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

  @Delete('/:id')
  async deleteCard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void | ObjectLiteral> {
    return this.repository.delete(id);
  }

  @ApiParam({ name: 'userId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id',
  })
  @UseGuards(AuthGuard)
  @Get('events/:userId')
  async getEventListByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ListUserEventDto[]> {
    return this.repository.getEventsFromUser(userId);
  }
}
