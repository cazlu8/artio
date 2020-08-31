import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { SponsorRepository } from '../sponsor.repository';

@Injectable()
export class ValidateSponsorId implements PipeTransform {
  constructor(private readonly repository: SponsorRepository) {}

  async transform(value): Promise<number | ObjectLiteral> {
    const exists = !!(await this.repository.count({
      where: { id: value.id ? value.id : value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
