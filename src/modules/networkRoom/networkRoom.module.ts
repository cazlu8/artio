import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NetworkRoomController } from './networkRoom.controller';
import { NetworkRoom } from './networkRoom.entity';
import { NetworkRoomService } from './networkRoom.service';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomGateway } from './networkRoom.gateway';
import { NetworkRoomProcessor } from './networkRoom.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'networkRoom',
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TypeOrmModule.forFeature([NetworkRoom]),
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
