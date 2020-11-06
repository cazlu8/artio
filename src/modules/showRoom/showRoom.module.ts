import { Module } from '@nestjs/common';
import { ShowRoomService } from './showRoom.service';
import { ShowRoomController } from './showRoom.controller';
import { LoggerService } from '../../shared/services/logger.service';
import EventQueue from '../event/event.queue';

@Module({
  imports: [EventQueue],
  providers: [ShowRoomService, LoggerService],
  controllers: [ShowRoomController],
  exports: [ShowRoomService],
})
export class ShowRoomModule {}
