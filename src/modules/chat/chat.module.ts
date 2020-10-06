import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '../../shared/services/jwt.service';

@Module({
  imports: [BaseModule],
  controllers: [ChatController],
  providers: [ChatService, JwtService, ChatGateway],
})
export class ChatModule {}
