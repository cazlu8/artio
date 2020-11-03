import { EntityRepository, Repository } from 'typeorm';
import { UserCategoryInterests } from './userCategoryInterests.entity';

@EntityRepository(UserCategoryInterests)
export class UserCategoryInterestsRepository extends Repository<
  UserCategoryInterests
> {}
