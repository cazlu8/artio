import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import * as groupBy from 'group-by';
import { SessionService } from './session.service';
import SessionListDTO from './dto/session.list.dto';
import { BaseController } from '../../shared/controllers/base.controller';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController extends BaseController {
  constructor(private service: SessionService) {
    super();
  }

  @Get('/:eventId')
  @ApiParam({ name: 'eventId', type: 'number' })
  @ApiCreatedResponse({
    type: SessionListDTO,
    description: 'get the session details',
  })
  getSessionDetails(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service
      .getSessionsFromEvent(eventId)
      .then((sessions: SessionListDTO[] | void) =>
        groupBy(sessions || [], 'dayTitle'),
      );
  }
}
