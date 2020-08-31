import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { RoleRepository } from '../role.repository';

@Injectable()
export class ValidateRoleId implements PipeTransform {
  constructor(private readonly repository: RoleRepository) {}

  async transform(value): Promise<number | ObjectLiteral> {
    const exists = !!(await this.repository.count({
      where: { id: value.id ? value.id : value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
