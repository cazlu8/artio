import { Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseController } from '../../shared/controllers/base.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { ShowRoomService } from './showRoom.service';

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
  ): Promise<{ apiKey: any; sessionId: any; token: any }> {
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
  async startSponsorRoomState(
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
}
