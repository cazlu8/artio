import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NetworkRoomController } from './networkRoom.controller';
import { NetworkRoomService } from './networkRoom.service';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomGateway } from './networkRoom.gateway';
import { NetworkRoomProcessor } from './networkRoom.processor';
import { UserEvents } from '../userEvents/userEvents.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'networkRoom',
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
      },
    }),
    TypeOrmModule.forFeature([UserEvents]),
  ],
  controllers: [NetworkRoomController],
  providers: [
    NetworkRoomService,
    LoggerService,
    NetworkRoomGateway,
    NetworkRoomProcessor,
  ],
})
export class NetworkRoomModule {}
