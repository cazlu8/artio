import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { UserRepository } from '../user.repository';

@Injectable()
export class ValidateUserId implements PipeTransform {
  constructor(private readonly repository: UserRepository) {}

  async transform(value: {
    id: number;
    userId: number;
  }): Promise<number | ObjectLiteral> {
    const id = this.toValidate(value);
    const exists = !!(await this.repository.count({
      where: { id },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }

  private toValidate(value: {
    id: number;
    userId: number;
  }): number | ObjectLiteral {
    const { id, userId } = value;
    if (id) {
      return id;
    }
    if (userId) {
      return userId;
    }
    return value;
  }
}
