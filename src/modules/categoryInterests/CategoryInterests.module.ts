import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { CategoryInterestsRepository } from './categoryInterests.repository';
import { CategoryInterestsController } from './categoryInterests.controller';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([CategoryInterestsRepository]),
  ],
  controllers: [CategoryInterestsController],
})
export class CategoryInterestsModule {}
