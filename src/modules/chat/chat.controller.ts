import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { ChatService } from './chat.service';
import { LoggerService } from '../../shared/services/logger.service';
import SendMessageDto from './dto/chat.sendMessage.dto';
import { BaseController } from '../../shared/controllers/base.controller';

@ApiTags('Chat')
@Controller('chat')
export class ChatController extends BaseController {
  constructor(
    private readonly loggerService: LoggerService,
    private service: ChatService,
  ) {
    super();
  }

  @Get('/:to/:from/:sponsorGuid/:eventId')
  async get(
    @Param(`to`) to: string,
    @Param(`from`) from: string,
    @Param(`sponsorGuid`) sponsorGuid: string,
    @Param(`eventId`, ParseIntPipe) eventId: number,
  ): Promise<void | ObjectLiteral> {
    return this.service.getMessages(eventId, to, from, sponsorGuid);
  }
}
