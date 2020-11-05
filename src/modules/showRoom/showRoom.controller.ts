import { ObjectLiteral } from 'typeorm';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseController } from '../../shared/controllers/base.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { ShowRoomService } from './showRoom.service';
import ChangeBroadcastLayoutDTO from './dto/broadcast.change.layout.dto';
import RegisterSessionParticipantDTO from './dto/session.register.participant.dto';

@ApiTags('ShowRoom')
@Controller('showRoom')
export class ShowRoomController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly service: ShowRoomService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    super();
  }

  @Get('session/sponsor/:eventId/:sponsorId')
  async getSessionData(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<{ apiKey: any; sessionId: any }> {
    return this.service.getSessionData(eventId, sponsorId);
  }

  @Get('session/sponsor/roomState/:eventId/:sponsorId')
  async getSponsorRoomState(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<{ apiKey: any; sessionId: any; token: any }> {
    return this.service.getSponsorRoomState(eventId, sponsorId);
  }

  @Put('session/sponsor/start/:eventId/:sponsorId')
  async startSponsorRoom(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.service.startSponsorRoomState(eventId, sponsorId);
    await this.eventQueue.add('sendMessageToUsersLinkedToEvent', {
      eventId,
      eventName: 'startSponsorRoomState',
      params: { sponsorId },
    });
  }

  @Post('session/sponsor/connect/:eventId/:sponsorId')
  async registerSessionParticipant(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() registerSessionParticipantDTO: RegisterSessionParticipantDTO,
  ): Promise<{ token: any }> {
    return await this.service.registerSessionParticipant(
      eventId,
      sponsorId,
      registerSessionParticipantDTO.streamRole,
    );
  }

  @Put('session/sponsor/stop/:eventId/:sponsorId')
  async stopSponsorRoom(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.service.stopSponsorRoom(eventId, sponsorId);
    await this.eventQueue.add('sendMessageToUsersLinkedToEvent', {
      eventId,
      eventName: 'stopSponsorRoomState',
      params: { sponsorId },
    });
  }

  @Put('session/sponsor/broadcast/:eventId/:sponsorId')
  async startBroadcastSponsorRoom(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return await this.service.startBroadcastSponsorRoom(eventId, sponsorId);
  }

  @Get('session/sponsor/broadcast/info/:eventId/:sponsorId')
  async getBroadcastInfo(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.service.getBroadcastInfo(eventId, sponsorId);
  }

  @Post('session/sponsor/broadcast/layout/:eventId/:sponsorId')
  async changeBroadcastLayout(
    @Param('sponsorId', ParseIntPipe) sponsorId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() changeBroadcastLayoutDTO: ChangeBroadcastLayoutDTO,
  ): Promise<void | ObjectLiteral> {
    return await this.service.changeBroadcastLayout(
      eventId,
      sponsorId,
      changeBroadcastLayoutDTO.type,
      changeBroadcastLayoutDTO.layout,
    );
  }
}
