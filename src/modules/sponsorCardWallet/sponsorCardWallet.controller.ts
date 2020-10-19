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
import { BaseController } from '../../shared/controllers/base.controller';
import { Event } from '../event/event.entity';
import { ListUserEventDto } from '../userEvents/dto/userEvents.list.dto';
import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { SponsorCardWalletRepository } from './sponsorCardWallet.repository';
import { SponsorCardWallet } from './sponsorCardWallet.entity';

@ApiTags('SponsorCardWallet')
@Controller('sponsorCardWallet')
export class SponsorCardWalletController extends BaseController {
  constructor(private readonly repository: SponsorCardWalletRepository) {
    super();
  }

  @ApiParam({ name: 'sponsorId', type: 'number' })
  @ApiCreatedResponse({
    type: SponsorCardWallet,
    description: 'Get cards from user',
  })
  @UseGuards(VerifyIfIsAuthenticatedUserGuard)
  @Get('/:sponsorId')
  async getCardsFromSponsor(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Req() req,
  ): Promise<void | ObjectLiteral> {
    return this.repository.getCardsFromSponsor(
      sponsorId,
      req.query.userName,
      +req.query.eventId,
    );
  }

  @ApiParam({ name: 'sponsorId', type: 'number' })
  @ApiCreatedResponse({
    type: SponsorCardWallet,
    description: 'Create user card to sponsor',
  })
  @UseGuards(VerifyIfIsAuthenticatedUserGuard)
  @Get('/:sponsorId/:userId/:eventId')
  async createSendCard(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void | ObjectLiteral> {
    return this.repository.save({ sponsorId, userId, eventId });
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: SponsorCardWallet,
    description: 'Delete card wallet',
  })
  @Delete('/:id')
  @HttpCode(204)
  @Header('Content-Length', '0')
  async deleteCard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void | ObjectLiteral> {
    return this.repository.delete({ id });
  }

  @ApiParam({ name: 'sponsorId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id',
  })
  @UseGuards(VerifyIfIsAuthenticatedUserGuard)
  @Get('events/:sponsorId')
  async getEventListBySponsorId(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
  ): Promise<ListUserEventDto[]> {
    return this.repository.getEventsFromSponsor(sponsorId);
  }
}
