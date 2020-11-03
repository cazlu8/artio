import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { BaseController } from '../../shared/controllers/base.controller';
import { CategoryInterestsRepository } from './categoryInterests.repository';
import { CategoryInterests } from './categoryInterests.entity';

@ApiTags('CategoryInterests')
@Controller('categoryInterests')
export class CategoryInterestsController extends BaseController {
  constructor(private readonly repository: CategoryInterestsRepository) {
    super();
  }

  @ApiCreatedResponse({
    description: 'get list of categories of interests',
  })
  @Get()
  async get(): Promise<CategoryInterests[]> {
    return this.repository.find();
  }
}
