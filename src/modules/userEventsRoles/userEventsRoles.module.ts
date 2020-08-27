import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { UserEventsRolesRepository } from './userEventsRoles.repository';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([UserEventsRolesRepository])],
})
export class UserEventsRolesModule {}
