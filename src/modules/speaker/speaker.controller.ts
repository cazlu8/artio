import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { BaseController } from '../../shared/controllers/base.controller';
import { SpeakerService } from './speaker.service';
import { Speaker } from './speaker.entity';

@ApiTags('Speakers')
@Controller('speakers')
export class SpeakerController extends BaseController {
  constructor(private speakerService: SpeakerService) {
    super();
  }

  @Get('/:id')
  @ApiCreatedResponse({
    type: Speaker,
    description: 'get speaker by id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  async findOne(@Param('id') id): Promise<Speaker | void> {
    return await this.speakerService.findOne(id);
  }
}
