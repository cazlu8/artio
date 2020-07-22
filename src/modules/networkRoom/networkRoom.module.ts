import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { NetworkRoomController } from './networkRoom.controller';
import { NetworkRoomService } from './networkRoom.service';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomGateway } from './networkRoom.gateway';
import { NetworkRoomProcessor } from './networkRoom.processor';
import { UserEvents } from '../userEvents/userEvents.entity';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'networkRoom',
      useFactory: async (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
      inject: [ConfigService],
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
