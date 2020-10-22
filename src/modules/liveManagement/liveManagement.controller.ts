import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { BaseController } from '../../shared/controllers/base.controller';
import { LiveManagementService } from './liveManagement.service';
import SetupInfraDTO from './dto/liveManagement.setupInfra.dto';

@ApiTags('LiveManagement')
@Controller('liveManagement')
export class LiveManagementController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly service: LiveManagementService,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: SetupInfraDTO,
    description: 'setup live infra',
  })
  @Post('/setupInfra')
  async setupInfra(
    @Body() setupInfraDTO: SetupInfraDTO,
  ): Promise<void | ObjectLiteral> {
    await this.service.setupInfra(setupInfraDTO);
  }
}
