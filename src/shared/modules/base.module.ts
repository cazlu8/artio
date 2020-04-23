import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../../modules/user/user.service';
import { User } from '../../modules/user/user.entity';
import { LoggerService } from '../services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule.forFeature([User]), UserService, LoggerService],
  providers: [UserService, LoggerService],
})
export class BaseModule {}
