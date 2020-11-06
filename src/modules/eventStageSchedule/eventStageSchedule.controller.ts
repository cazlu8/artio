import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { BaseController } from '../../shared/controllers/base.controller';
import { EventStageScheduleRepository } from './eventStageSchedule.repository';
import EventStageScheduleCreateDTO from './dto/eventStageSchedule.create.dto';
import EventStageScheduleUpdateDTO from './dto/eventStageSchedule.update';
import { VerifyDateInBetween } from './pipes/verifyDateInBetween';
import { EventStageScheduleService } from './eventStageSchedule.service';

@ApiTags('EventStageSchedule')
@Controller('schedule')
export class EventStageScheduleController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly repository: EventStageScheduleRepository,
    private readonly service: EventStageScheduleService,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: EventStageScheduleCreateDTO,
    description: 'The role has been successfully created',
  })
  @UsePipes(VerifyDateInBetween)
  @Post()
  async create(
    @Body() eventStageScheduleCreateDTO: EventStageScheduleCreateDTO,
  ): Promise<void | ObjectLiteral> {
    await this.repository.save(eventStageScheduleCreateDTO);
    this.loggerService.info(
      `Schedule for event stage: ${eventStageScheduleCreateDTO.eventStageId} Created`,
    );
  }

  @ApiParam({ name: 'eventStageId', type: 'number' })
  @ApiCreatedResponse({
    description: 'Get schedule by eventStageId',
  })
  @Get('/:eventStageId')
  async getScheduleFromStage(
    @Param('eventStageId', ParseIntPipe) eventStageId,
  ): Promise<any | void> {
    return this.service.getScheduleFromStage(eventStageId);
  }

  @ApiParam({ name: 'eventStageScheduleId', type: 'number' })
  @ApiCreatedResponse({
    description: 'Update schedule',
  })
  @Put('/:eventStageScheduleId')
  @HttpCode(204)
  async updateSchedule(
    @Param('eventStageScheduleId', ParseIntPipe) eventStageScheduleId: number,
    @Body() eventStageScheduleUpdateDTO: EventStageScheduleUpdateDTO,
  ): Promise<any | void> {
    await this.repository.update(
      eventStageScheduleId,
      eventStageScheduleUpdateDTO,
    );
    this.loggerService.info(
      `Schedule for event stage: ${eventStageScheduleId} Updated`,
    );
  }
}
