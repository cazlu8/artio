import { EntityRepository, Repository } from 'typeorm';
import { CategoryInterests } from './categoryInterests.entity';

@EntityRepository(CategoryInterests)
export class CategoryInterestsRepository extends Repository<
  CategoryInterests
> {}
