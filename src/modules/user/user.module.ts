import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LoggerService } from '../../shared/services/logger.service';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { UserEventsRoles } from '../userEventsRoles/userEventsRoles.entity';
import { Role } from '../role/role.entity';
import { UserEventsModule } from '../userEvents/userEvents.module';
import { UserProcessor } from './user.processor';
import UserQueue from './user.queue';
import { EmailService } from '../../shared/services/email/email.service';
import { EventRepository } from '../event/event.repository';
import { BaseModule } from '../../shared/modules/base.module';
import { UploadService } from '../../shared/services/upload.service';
import { UserGateway } from './user.gateway';
import { JwtService } from '../../shared/services/jwt.service';

@Module({
  imports: [
    BaseModule,
    UserQueue,
    TypeOrmModule.forFeature([
      User,
      UserRepository,
      UserEventsRoles,
      Role,
      EventRepository,
    ]),
    UserEventsModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    LoggerService,
    EmailService,
    UploadService,
    UserProcessor,
    UserGateway,
    JwtService,
  ],
  exports: [UserService],
})
export class UserModule {}
