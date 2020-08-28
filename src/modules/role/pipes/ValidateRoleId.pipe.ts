import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../role.repository';

@Injectable()
export class ValidateRoleId implements PipeTransform {
  constructor(private readonly repository: RoleRepository) {}

  async transform(value: any) {
    try {
      await this.repository.findOneOrFail({
        where: { id: value },
      });
      return value;
    } catch (error) {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    }
    return value;
  }
}
