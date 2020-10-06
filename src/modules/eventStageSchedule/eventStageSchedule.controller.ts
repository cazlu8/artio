import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { BaseController } from '../../shared/controllers/base.controller';
import { EventStageScheduleRepository } from './eventStageSchedule.repository';
import EventStageScheduleDTO from './dto/eventStageSchedule.create.dto';

@ApiTags('EventStageSchedule')
@Controller('schedule')
export class EventStageScheduleController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly repository: EventStageScheduleRepository,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: EventStageScheduleDTO,
    description: 'The role has been successfully created',
  })
  @Post()
  async create(
    @Body() eventStageScheduleDTO: EventStageScheduleDTO,
  ): Promise<void | ObjectLiteral> {
    await this.repository.save(eventStageScheduleDTO);
    this.loggerService.info(
      `Schedule for event stage: ${eventStageScheduleDTO.eventStageId} Created`,
    );
  }

  @ApiParam({ name: 'eventStageId', type: 'number' })
  @ApiCreatedResponse({
    description: 'Get schedule by eventStageId',
  })
  @Get('/:eventStageId')
  async findOne(
    @Param('eventStageId', ParseIntPipe) eventStageId,
  ): Promise<any | void> {
    return this.repository.getScheduleFromStage(eventStageId);
  }
}
