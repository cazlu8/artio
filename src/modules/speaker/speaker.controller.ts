import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { BaseController } from '../../shared/controllers/base.controller';
import { SpeakerService } from './speaker.service';
import { Speaker } from './speaker.entity';
import SpeakerEventDTO from './dto/speaker.event.dto';

@ApiTags('Speakers')
@Controller('speakers')
export class SpeakerController extends BaseController {
  constructor(private service: SpeakerService) {
    super();
  }

  @Get('/:eventId')
  @ApiCreatedResponse({
    type: Speaker,
    description: 'get speakers from an event',
  })
  @ApiParam({ name: 'eventId', type: 'number' })
  async findSpeakerByEventId(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<SpeakerEventDTO[] | void> {
    return await this.service.getSpeakerFromEvent(eventId);
  }
}
