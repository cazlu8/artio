import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { ChatService } from './chat.service';

@Module({
  imports: [BaseModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
