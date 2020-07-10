import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LoggerService } from '../../shared/services/logger.service';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { UserEvents } from '../userEvents/userEvents.entity';
import { UserEventsRoles } from '../userEventsRoles/user.events.roles.entity';
import { Role } from '../role/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRepository,
      UserEvents,
      UserEventsRoles,
      Role,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, LoggerService],
})
export class UserModule {}
