import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '../../shared/services/jwt.service';
import ChatQueue from './chat.queue';
import { ChatProcessor } from './chat.processor';

@Module({
  imports: [BaseModule, ChatQueue],
  controllers: [ChatController],
  providers: [ChatService, JwtService, ChatProcessor, ChatGateway],
})
export class ChatModule {}
