import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsorController } from './sponsor.controller';
import { SponsorService } from './sponsor.service';
import { LoggerService } from '../../shared/services/logger.service';
import { SponsorRepository } from './sponsor.repository';
import { Sponsor } from './sponsor.entity';
import { EventSponsors } from '../eventSponsors/eventSponsors.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sponsor, SponsorRepository, EventSponsors]),
  ],
  controllers: [SponsorController],
  providers: [SponsorService, LoggerService],
})
export class SponsorModule {}
