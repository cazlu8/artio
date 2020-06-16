import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkRoomController } from './networkRoom.controller';
import { NetworkRoom } from './networkRoom.entity';
import { NetworkRoomService } from './networkRoom.service';
import { LoggerService } from '../../shared/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([NetworkRoom])],
  controllers: [NetworkRoomController],
  providers: [NetworkRoomService, LoggerService],
})
export class NetworkRoomModule {}
