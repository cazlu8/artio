import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral, UpdateResult } from 'typeorm/index';
import { EventService } from './event.service';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';
import EventPastListDto from './dto/event.past.dto';
import CreateEventDTO from './dto/event.create.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { Event } from './event.entity';
import UpdateEventDTO from './dto/event.update.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { AdminAuthGuard } from '../../shared/guards/adminAuth.guard';
import CreateHeroImage from './dto/event.create.heroImage.dto';
import EventStartIntermissionDto from './dto/event.startIntermission.dto';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseWithoutAuthController {
  constructor(private service: EventService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateEventDTO,
    description: 'The event has been successfully created',
  })
  @Post()
  @UseGuards(AdminAuthGuard)
  async create(@Body() createEventDto: CreateEventDTO) {
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
    @Res() res,
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
  createHeroImage(@Body() createHeroImage: CreateHeroImage) {
    return this.service.createHeroImage(createHeroImage);
  }

  @ApiCreatedResponse({
    type: EventListDto,
    description: 'All happening now events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/happening-now')
  async getHappeningNowEvents(): Promise<EventListDto[] | void> {
    return await this.service.getHappeningNowEvents();
  }

  @ApiParam({ name: 'skip', type: 'number' })
  @ApiCreatedResponse({
    type: EventUpcomingListDto,
    description: 'All upcoming events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/upcoming/:skip')
  async getUpcomingEvents(
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<EventUpcomingListDto> {
    return await this.service.getUpcomingEvents(skip);
  }

  @ApiParam({ name: 'skip', type: 'number' })
  @ApiCreatedResponse({
    type: EventUpcomingListDto,
    description: 'Past events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/past/:skip')
  async getPastEvents(
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<EventPastListDto> {
    return await this.service.getPastEvents(skip);
  }

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
    return await this.service.getEventDetails(id);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'The event was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id): Promise<Partial<Event> | void> {
    return await this.service.getEvent(id);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'All events were successfully retrieved',
  })
  @UseGuards(AdminAuthGuard)
  @Get()
  async find(): Promise<Partial<Event[]> | void> {
    return await this.service.getEvents();
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id and role was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('eventsByRole/:userId/:roleId')
  async getUserEventsByRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return await this.service.getUserEventsByRole(userId, roleId);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Happening now events by user id were successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('happeningNowByUser/:userId')
  async getHappeningNowByUser(@Param('userId', ParseIntPipe) userId: number) {
    return await this.service.getHappeningNowByUser(userId);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Upcoming events by user id were successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('upcomingByUser/:userId/:skip')
  async getUpcomingByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ) {
    return await this.service.getUpcomingByUser(userId, skip);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Past events by user id were successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('pastByUser/:userId/:skip')
  async getPastByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ) {
    return await this.service.getPastByUser(userId, skip);
  }

  @ApiParam({ name: 'getIntermissionStatus' })
  @ApiCreatedResponse({
    description: 'Intermission Status was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/getIntermissionStatus/:eventId')
  getIntermissionStatus(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<ObjectLiteral | boolean> {
    return this.service.getIntermissionStatus(eventId);
  }

  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Amount of subscribers on event was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/subscribed/:eventId')
  getSubscribed(@Param('eventId', ParseIntPipe) eventId: number): Promise<any> {
    return this.service.getSubscribed(eventId);
  }

  @ApiParam({ name: 'startIntermission' })
  @ApiCreatedResponse({
    description: 'Intermission started',
  })
  @UseGuards(AuthGuard)
  @Put('/startIntermission')
  startIntermission(
    @Body() eventStartIntermissionDto: EventStartIntermissionDto,
    @Res() res,
  ): Promise<void | UpdateResult> {
    return this.service
      .startIntermission(eventStartIntermissionDto)
      .then(() => res.status(204).send());
  }

  @ApiParam({ name: 'finishIntermission' })
  @ApiCreatedResponse({
    description: 'Intermission finished',
  })
  @UseGuards(AuthGuard)
  @Put('/finishIntermission/:eventId')
  finishIntermission(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Res() res,
  ): Promise<void | UpdateResult> {
    return this.service
      .finishIntermission(eventId)
      .then(() => res.status(204).send());
  }

  @ApiParam({ name: 'startLive' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Live started',
  })
  @UseGuards(AuthGuard)
  @Put('/startLive/:eventId')
  startLive(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Res() res,
  ): Promise<void | UpdateResult> {
    return this.service.startLive(eventId).then(() => res.status(204).send());
  }

  @ApiParam({ name: 'finishLive' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Live finished',
  })
  @UseGuards(AuthGuard)
  @Put('/finishLive/:eventId')
  finishLive(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Res() res,
  ): Promise<void | UpdateResult> {
    return this.service.finishLive(eventId).then(() => res.status(204).send());
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'HeroImage image by user id successfuly removed',
  })
  @UseGuards(AuthGuard)
  @Delete('removeHeroImage/:id')
  removeHeroImage(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHeroImage(id);
  }
}
