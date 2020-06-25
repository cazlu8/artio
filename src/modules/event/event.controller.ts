import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  // UseGuards,
  // UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { EventService } from './event.service';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';
import CreateEventDTO from './dto/event.create.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { User } from '../user/user.entity';
// import { AuthGuard } from '../../shared/guards/auth.guard';
// import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { Event } from './event.entity';
// import { AuthGuard } from '../../shared/guards/auth.guard';
// import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';

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
  // @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post()
  create(@Body() createEventDto: CreateEventDTO) {
    return this.service.create(createEventDto);
  }

  @Get('/happening-now')
  @ApiCreatedResponse({
    type: EventListDto,
    description: 'get the happening now events',
    isArray: true,
  })
  async getHappeningNowEvents(): Promise<EventListDto[] | void> {
    return await this.service.getHappeningNowEvents();
  }

  @Get('/upcoming/:skip')
  @ApiParam({ name: 'skip', type: 'number' })
  @ApiCreatedResponse({
    type: EventUpcomingListDto,
    description: 'get the upcoming events',
    isArray: true,
  })
  async getUpcomingEvents(
    @Param('skip', ParseIntPipe) skip: number,
  ): Promise<EventUpcomingListDto> {
    return await this.service.getUpcomingEvents(skip);
  }

  @Get('/details/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: EventDetailsDTO,
    description: 'get the event details',
  })
  async getEventDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventDetailsDTO> {
    return await this.service.getEventDetails(id);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'get user by guid',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @Get('/:id')
  async findOne(@Param('id') id): Promise<Partial<Event> | void> {
    return this.service.getEvent(id);
  }
}
