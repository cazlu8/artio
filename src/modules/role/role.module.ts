import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([RoleRepository])],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
