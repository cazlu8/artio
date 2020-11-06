import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { SpeakerRepository } from './speaker.repository';
import { BaseController } from '../../shared/controllers/base.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { SpeakerCreateDTO } from './dto/speaker.create.dto';
import { Speaker } from './speaker.entity';
import { EventStageScheduleSpeakerRepository } from '../eventStageScheduleSpeaker/eventStageScheduleSpeaker.repository';
import { LinkSpeakerToScheduleDTO } from './dto/speaker.linkSpeakerToSchedule.dto';

@ApiTags('Speaker')
@Controller('speaker')
export class SpeakerController extends BaseController {
  constructor(
    private readonly repository: SpeakerRepository,
    private readonly eventStageScheduleSpeakerRepository: EventStageScheduleSpeakerRepository,
    private readonly loggerService: LoggerService,
  ) {
    super();
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: SpeakerCreateDTO,
    description: 'Speaker has been successfully created',
  })
  @HttpCode(204)
  @Post('linkToSchedule')
  async linkSpeakerToSchedule(
    @Body() createScheduleSpeakerDTO: LinkSpeakerToScheduleDTO,
  ): Promise<void> {
    await this.eventStageScheduleSpeakerRepository.save(
      createScheduleSpeakerDTO,
    );
    this.loggerService.info(
      `Speaker ${createScheduleSpeakerDTO.speakerId} has been linked to schedule ${createScheduleSpeakerDTO.scheduleId}`,
    );
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: SpeakerCreateDTO,
    description: 'Speaker has been successfully created',
  })
  @HttpCode(204)
  @Post()
  async create(@Body() createSpeakerDTO: SpeakerCreateDTO): Promise<Speaker> {
    const speaker = await this.repository.save(createSpeakerDTO);
    this.loggerService.info(`Speaker has been created`);
    return speaker;
  }
}
