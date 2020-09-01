import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { UserRepository } from '../user.repository';

@Injectable()
export class ValidateIfIdExists implements PipeTransform {
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
    if (typeof value === 'string' || typeof value === 'number') return value;
    const { id, userId } = value;
    return id || userId;
  }
}
