import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeakerController } from './speaker.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { SpeakerRepository } from './speaker.repository';
import { SpeakerService } from './speaker.service';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([SpeakerRepository])],
  controllers: [SpeakerController],
  providers: [SpeakerService],
})
export class SpeakerModule {}
