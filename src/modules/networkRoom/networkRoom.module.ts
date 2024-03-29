import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkRoomService } from './networkRoom.service';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomGateway } from './networkRoom.gateway';
import { NetworkRoomProcessor } from './networkRoom.processor';
import { UserEvents } from '../userEvents/userEvents.entity';
import NetworkRoomQueue from './networkRoom.queue';
import { JwtService } from '../../shared/services/jwt.service';
import { NetworkRoomController } from './networkRoom.controller';

@Module({
  imports: [NetworkRoomQueue, TypeOrmModule.forFeature([UserEvents])],
  providers: [
    NetworkRoomService,
    LoggerService,
    NetworkRoomGateway,
    NetworkRoomProcessor,
    JwtService,
  ],
  controllers: [NetworkRoomController],
  exports: [NetworkRoomService, NetworkRoomQueue],
})
export class NetworkRoomModule {}
