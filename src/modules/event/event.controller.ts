import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { UpdateResult } from 'typeorm';
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
import { AdminAuthGuard } from '../../shared/guards/admin-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseWithoutAuthController {
  constructor(private service: EventService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateEventDTO,
    description: 'the event has been successfully created',
  })
  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() createEventDto: CreateEventDTO) {
    return this.service.create(createEventDto);
  }

  @ApiCreatedResponse({
    type: EventListDto,
    description: 'get all happening now events',
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
    description: 'get all upcoming events',
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
    description: 'get all past events',
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
    description: 'get event details',
  })
  @UseGuards(AuthGuard)
  @Get('/details/:id')
  async getEventDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventDetailsDTO> {
    return await this.service.getEventDetails(id);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get event by id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id): Promise<Partial<Event> | void> {
    return this.service.getEvent(id);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get all events',
  })
  @UseGuards(AdminAuthGuard)
  @Get()
  async find(): Promise<Partial<Event[]> | void> {
    return this.service.getEvents();
  }

  @ApiCreatedResponse({
    type: UpdateEventDTO,
    description: 'the event has been successfully updated',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Put('/:id')
  update(
    @Res() res,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDTO,
  ): Promise<void | UpdateResult> {
    return this.service
      .updateEventInfo(id, updateEventDto)
      .then(() => res.status(204).send());
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get events by user id and role',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('eventsByRole/:userId/:roleId')
  async getUserEventsByRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.service.getUserEventsByRole(userId, roleId);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get happening now events by user id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('happeningNowByUser/:userId')
  async getHappeningNowByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getHappeningNowByUser(userId);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get upcoming events by user id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('upcomingByUser/:userId/:skip')
  async getUpcomingByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ) {
    return this.service.getUpcomingByUser(userId, skip);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get past events by user id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('pastByUser/:userId/:skip')
  async getPastByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('skip', ParseIntPipe) skip: number,
  ) {
    return this.service.getPastByUser(userId, skip);
  }
}
