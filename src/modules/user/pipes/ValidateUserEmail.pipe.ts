import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../user.repository';

@Injectable()
export class ValidateUserEmail implements PipeTransform {
  constructor(private readonly repository: UserRepository) {}

  async transform(value: string): Promise<string> {
    const exists = !!(await this.repository.count({
      where: { email: value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
