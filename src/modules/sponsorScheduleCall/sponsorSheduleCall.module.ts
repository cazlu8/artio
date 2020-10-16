import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { SponsorScheduleCallRepository } from './sponsorScheduleCall.repository';
import { SponsorScheduleCallController } from './sponsorScheduleCall.controller';
import { SponsorScheduleCallService } from './sponsorScheduleCall.service';

@Module({
  imports: [TypeOrmModule.forFeature([SponsorScheduleCallRepository])],
  controllers: [SponsorScheduleCallController],
  providers: [SponsorScheduleCallService, LoggerService],
})
export class SponsorModule {}
