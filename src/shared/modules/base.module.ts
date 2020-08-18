import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '../services/logger.service';

@Module({
  imports: [ConfigModule],
  exports: [LoggerService],
  providers: [ConfigService, LoggerService],
})
export class BaseModule {}
