import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseController } from '../../shared/controllers/base.controller';
import { EventStagesRepository } from './eventStages.repository';
import CreateEventStageDTO from './dto/eventStage.create.dto';
import { LoggerService } from '../../shared/services/logger.service';
import { ValidateIfEventExists } from '../event/pipes/ValidateIfEventExists.pipe';
import { EventStages } from './eventStages.entity';

@ApiTags('EventStage')
@Controller('eventStage')
export class EventStagesController extends BaseController {
  constructor(
    private readonly repository: EventStagesRepository,
    private readonly loggerService: LoggerService,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateEventStageDTO,
    description: 'The event stage has been successfully created',
  })
  @Post()
  @UsePipes(ValidateIfEventExists)
  async create(
    @Body() createEventDto: CreateEventStageDTO,
  ): Promise<void | ObjectLiteral> {
    const eventStage = await this.repository.save(createEventDto);
    this.loggerService.info(
      `Event ${eventStage.name} created for the event ${eventStage.eventId}`,
    );
    return eventStage;
  }

  @ApiCreatedResponse({
    description: 'get stages by eventId',
  })
  @Get('/:eventId')
  @UsePipes(ValidateIfEventExists)
  async get(@Param('eventId') eventId: number): Promise<void | EventStages[]> {
    return this.repository.getStagesByEventId(eventId);
  }
}
