import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../user.repository';

@Injectable()
export class ValidateIfGuidExists implements PipeTransform {
  constructor(private readonly repository: UserRepository) {}

  async transform(value: string): Promise<string> {
    const exists = !!(await this.repository.count({
      where: { guid: value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
