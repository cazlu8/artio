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
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral, UpdateResult } from 'typeorm';
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
import { ValidateEventId } from './pipes/ValidateEventId.pipe';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseWithoutAuthController {
  constructor(
    private service: EventService,
    private readonly repository: EventRepository,
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

  @ApiCreatedResponse({
    type: EventListDto,
    description: 'All happening now events were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AdminAuthGuard)
  @Get('/happeningNow')
  async getHappeningNowEvents(): Promise<EventListDto[] | void> {
    return this.service.getHappeningNowEvents();
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: EventListDto,
    description: 'Happening now events by user id were successfully retrieved',
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('happeningNow/:userId')
  async getHappeningNowByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<EventListDto[] | void> {
    return this.service.getHappeningNowByUser(userId);
  }

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

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'The event was successfully retrieved',
  })
  @UsePipes(ValidateEventId)
  @UseGuards(AuthGuard)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id): Promise<Partial<Event> | void> {
    return this.repository.findOne({ id });
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'All events were successfully retrieved',
  })
  @UseGuards(AdminAuthGuard)
  @Get()
  async find(): Promise<Partial<Event[]> | void> {
    return this.service.getEvents();
  }

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
    return this.service.getUserEventsByRole(userId, roleId);
  }

  @ApiParam({ name: 'getIntermissionStatus' })
  @ApiCreatedResponse({
    description: 'Intermission Status was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/getIntermissionStatus/:eventId')
  async getIntermissionStatus(
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
  async getSubscribed(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<any> {
    return this.service.getSubscribed(eventId);
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
  @Put('/startLive/:eventId')
  @HttpCode(204)
  async startLive(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.service.startLive(eventId);
  }

  @ApiParam({ name: 'finishLive' })
  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'Live finished',
  })
  @UseGuards(AuthGuard)
  @Put('/finishLive/:eventId')
  @HttpCode(204)
  async finishLive(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void | UpdateResult> {
    return this.service.finishLive(eventId);
  }
}
