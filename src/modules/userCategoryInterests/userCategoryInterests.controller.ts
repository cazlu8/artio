import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { BaseController } from '../../shared/controllers/base.controller';
import { UserCategoryInterestsRepository } from './userCategoryInterests.repository';
import UserCategoryInterestsCreateDTO from './dto/userCategoryInterests.create.dto';
import { LoggerService } from '../../shared/services/logger.service';

@ApiTags('UserCategoryInterests')
@Controller('userCategoryInterests')
export class UserCategoryInterestsController extends BaseController {
  constructor(
    private readonly repository: UserCategoryInterestsRepository,
    private readonly loggerService: LoggerService,
  ) {
    super();
  }

  @ApiCreatedResponse({
    description: 'Save user category interest',
  })
  @Post()
  async save(
    @Body() userCategoryInterestsCreateDTO: UserCategoryInterestsCreateDTO,
  ): Promise<void> {
    await this.repository.save(userCategoryInterestsCreateDTO);
    this.loggerService.info(
      `User category interests created with category: ${userCategoryInterestsCreateDTO.categoryId} for user ${userCategoryInterestsCreateDTO.userId}`,
    );
  }
}
