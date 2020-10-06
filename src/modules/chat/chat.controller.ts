import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { ChatService } from './chat.service';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { LoggerService } from '../../shared/services/logger.service';
import SendMessageDto from './dto/chat.sendMessage.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private service: ChatService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<void | ObjectLiteral> {
    await this.create(sendMessageDto);
  }
}
