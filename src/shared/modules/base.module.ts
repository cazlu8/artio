import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../../modules/user/user.service';
import { User } from '../../modules/user/user.entity';
import { LoggerService } from '../services/logger.service';
import { UserEvents } from '../../modules/userEvents/userEvents.entity';
import { UserEventsRoles } from '../../modules/userEventsRoles/user.events.roles.entity';
import { Role } from '../../modules/role/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserEvents, UserEventsRoles, Role]),
  ],
  exports: [TypeOrmModule.forFeature([User]), UserService, LoggerService],
  providers: [UserService, LoggerService],
})
export class BaseModule {}
