import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LoggerService } from '../../shared/services/logger.service';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { UserEventsRoles } from '../userEventsRoles/user.events.roles.entity';
import { Role } from '../role/role.entity';
import { UserEventsModule } from '../userEvents/userEvents.module';
import { UserProcessor } from './user.processor';
import UserQueue from './user.queue';

@Module({
  imports: [
    UserQueue,
    TypeOrmModule.forFeature([User, UserRepository, UserEventsRoles, Role]),
    UserEventsModule,
  ],
  controllers: [UserController],
  providers: [UserService, LoggerService, UserProcessor],
  exports: [UserService],
})
export class UserModule {}
