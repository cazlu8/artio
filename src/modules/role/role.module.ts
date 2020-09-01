import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';
import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([RoleRepository, UserRepository]),
    UserModule,
  ],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
