import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { BaseController } from '../../shared/controllers/base.controller';
import { EventService } from './event.service';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseController {
  constructor(private service: EventService) {
    super();
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

  @Get('/:id')
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
}
