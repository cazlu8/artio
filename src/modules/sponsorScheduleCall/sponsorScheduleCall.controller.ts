import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseController } from '../../shared/controllers/base.controller';
import { SponsorScheduleCallRepository } from './sponsorScheduleCall.repository';
import { CreateSponsorScheduleCallDto } from './dto/sponsorScheduleCall.create.dto';
import { SponsorScheduleCallService } from './sponsorScheduleCall.service';

@ApiTags('SponsorScheduleCall')
@Controller('sponsorScheduleCall')
export class SponsorScheduleCallController extends BaseController {
  constructor(
    private readonly repository: SponsorScheduleCallRepository,
    private readonly service: SponsorScheduleCallService,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateSponsorScheduleCallDto,
    description: 'The sponsor schedule call has been successfully created',
  })
  @Post()
  async create(
    @Body() createSponsorScheduleCallDto: CreateSponsorScheduleCallDto,
  ): Promise<ObjectLiteral | void> {
    return this.repository.save(createSponsorScheduleCallDto);
  }

  @ApiCreatedResponse({
    description: 'Get sponsor schedule calls',
  })
  @Get('/:sponsorId')
  async get(@Param('sponsorId', ParseIntPipe) sponsorId: number): Promise<any> {
    return this.service.getScheduleCalls(sponsorId);
  }
}
