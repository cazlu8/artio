import {
  Body,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral, UpdateResult } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventService } from './event.service';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import CreateEventDTO from './dto/event.create.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { Event } from './event.entity';
import UpdateEventDTO from './dto/event.update.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { AdminAuthGuard } from '../../shared/guards/adminAuth.guard';
import CreateHeroImage from './dto/event.create.heroImage.dto';
import EventStartIntermissionDto from './dto/event.startIntermission.dto';
import { EventRepository } from './event.repository';
import { ValidateIfEventExists } from './pipes/ValidateIfEventExists.pipe';
import { UserEventsRepository } from '../userEvents/userEvents.repository';
import { LoggerService } from '../../shared/services/logger.service';
import { SponsorDetail } from '../sponsor/dto/sponsor.detail.dto';
import { EventGateway } from './event.gateway';
import { OrganizerAuthGuard } from '../../shared/guards/organizerAuth.guard';
import { UserEventsGuard } from './guards/userEvents.guard';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private service: EventService,
    private readonly eventGateway: EventGateway,
    private readonly repository: EventRepository,
    private readonly userEventsRepository: UserEventsRepository,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateEventDTO,
    description: 'The event has been successfully created',
  })
  @Post()
  @UseGuards(AdminAuthGuard)
  async create(
    @Body() createEventDto: CreateEventDTO,
  ): Promise<void | ObjectLiteral> {
    return this.service.create(createEventDto);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'The event has been successfully updated',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDTO,
  ): Promise<void | UpdateResult> {
    return this.service.updateEventInfo(id, updateEventDto);
  }

  @ApiCreatedResponse({
    type: CreateHeroImage,
    description: 'The heroImage has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post('/createHeroImage')
  async createHeroImage(@Body() createHeroImage: CreateHeroImage) {
    return this.service.createHeroImage(createHeroImage);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'HeroImage image by user id successfuly removed',
  })
  @UseGuards(AuthGuard)
  @Delete('removeHeroImage/:id')
  async removeHeroImage(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHeroImage(id);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'skip', type: 'number' })
  @ApiCreatedResponse({
    type: EventListDto,
    description: 'All upcoming events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/upcoming/:skip')
  async getUpcomingEvents(
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<EventListDto[] | void> {
    return this.service.getUpcomingEvents(skip);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: EventListDto,
    description: 'Upcoming events by user id were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('upcoming/:userId/:skip')
  async getUpcomingByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
    return this.service.getUpcomingByUser(userId, skip);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'skip', type: 'number' })
  @ApiCreatedResponse({
    type: EventListDto,
    description: 'Past events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/past/:skip')
  async getPastEvents(
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
    return this.service.getPastEvents(skip);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Past events by user id were successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('past/:userId/:skip')
  async getPastByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
    return this.service.getPastByUser(userId, skip);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: EventDetailsDTO,
    description: 'The event details was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/details/:id')
  async getEventDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventDetailsDTO> {
    return this.service.getEventDetails(id);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'The event was successfully retrieved',
  })
  @UsePipes(ValidateIfEventExists)
  @UseGuards(AuthGuard, OrganizerAuthGuard, UserEventsGuard)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id): Promise<Partial<Event> | void> {
    return this.repository.findOne({ id });
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'The event about info was successfully retrieved',
  })
  @UsePipes(ValidateIfEventExists)
  @UseGuards(AuthGuard, UserEventsGuard)
  @Get('/about/:id')
  async getAbout(
    @Param('id', ParseIntPipe) id,
  ): Promise<Partial<Event> | void> {
    return this.repository.findOne({ id });
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'The event was successfully retrieved',
  })
  @UsePipes(ValidateIfEventExists)
  @UseGuards(AuthGuard, UserEventsGuard)
  @Get('attend/:id')
  async findOneForAttend(
    @Param('id', ParseIntPipe) id,
  ): Promise<Partial<Event> | void> {
    return this.repository.findOne({ id });
  }

  @UseInterceptors(CacheInterceptor)
  @ApiCreatedResponse({
    type: Event,
    description: 'All events were successfully retrieved',
  })
  @UseGuards(AdminAuthGuard)
  @Get()
  async find(): Promise<Partial<Event[]> | void> {
    return this.repository.find();
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id and role was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('user/:userId/role/:roleId')
  async getUserEventsByRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.repository.getUserEventsByRole(userId, roleId);
  }

  @UseInterceptors(CacheInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: SponsorDetail,
    description: 'Events by user id and role was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('sponsors/:eventId')
  async getEventSponsor(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<SponsorDetail[]> {
    return this.repository.getEventSponsor(eventId);
  }

  @ApiParam({ name: 'getIntermissionStatus' })
  @ApiCreatedResponse({
    description: 'Intermission Status was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/getIntermissionStatus/:eventId')
  async getIntermissionStatus(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<number | boolean> {
    return this.service.getIntermissionStatus(eventId);
  }

  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Amount of subscribers on event was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/subscribed/:eventId')
  async getSubscribed(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<any> {
    return this.userEventsRepository.count({
      where: { eventId },
    });
  }

  @ApiParam({ name: 'startIntermission' })
  @ApiCreatedResponse({
    description: 'Intermission started',
  })
  @UseGuards(AuthGuard)
  @Put('/startIntermission')
  @HttpCode(204)
  async startIntermission(
    @Body() eventStartIntermissionDto: EventStartIntermissionDto,
  ): Promise<void | UpdateResult> {
    return this.service.startIntermission(eventStartIntermissionDto);
  }

  @ApiParam({ name: 'finishIntermission' })
  @ApiCreatedResponse({
    description: 'Intermission finished',
  })
  @UseGuards(AuthGuard)
  @Put('/finishIntermission/:eventId')
  @HttpCode(204)
  async finishIntermission(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void | UpdateResult> {
    return this.service.finishIntermission(eventId);
  }

  @ApiParam({ name: 'startLive' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Live started',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Put('/startLive/:eventId')
  async startLive(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.service.updateLive(eventId, true);
  }

  @ApiParam({ name: 'finishLive' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Live finished',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Put('/finishLive/:eventId')
  async finishLive(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.service.updateLive(eventId, false);
  }

  @ApiParam({ name: 'destroyInfra' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Stop and destroy live infra',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Put('/destroyInfra/:eventId/:stageId')
  async destroyInfra(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
  ): Promise<void> {
    await this.eventQueue.add('stopMediaLiveChannel', { eventId, stageId });
  }

  @ApiParam({ name: 'startPreview' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Start preview live infra',
  })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Put('/startPreview/:eventId/:stageId/:minutes')
  async startPreviewInfra(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Param('minutes', ParseIntPipe) minutes: number,
  ): Promise<void> {
    await this.service.startPreviewLiveInfra(eventId, stageId, minutes);
  }
}
