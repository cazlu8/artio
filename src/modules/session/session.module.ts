import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionController } from './session.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { SessionService } from './session.service';
import { SessionRepository } from './session.repository';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([SessionRepository])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
