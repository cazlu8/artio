import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/user.create.dto';
import { UserRepository } from '../user.repository';

@Injectable()
export class ValidateIfUserIsUnique implements PipeTransform {
  constructor(private readonly repository: UserRepository) {}

  async transform(value: CreateUserDto): Promise<CreateUserDto> {
    const exists = !!(await this.repository.count({
      where: { email: value.email, guid: value.guid },
    }));
    if (exists) throw new UnprocessableEntityException();
    return value;
  }
}
