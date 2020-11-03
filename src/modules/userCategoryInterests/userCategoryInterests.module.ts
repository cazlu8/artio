import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { UserCategoryInterestsRepository } from './userCategoryInterests.repository';
import { UserCategoryInterestsController } from './userCategoryInterests.controller';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([UserCategoryInterestsRepository]),
  ],
  controllers: [UserCategoryInterestsController],
})
export class UserCategoryInterestsModule {}
