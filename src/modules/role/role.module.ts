import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([RoleRepository]), UserModule],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
