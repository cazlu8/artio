import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeakerController } from './speaker.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { Speaker } from './speaker.entity';
import { SpeakerService } from './speaker.service';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([Speaker])],
  controllers: [SpeakerController],
  providers: [SpeakerService],
})
export class SpeakerModule {}
