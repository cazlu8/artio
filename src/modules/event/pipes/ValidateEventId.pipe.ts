import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { EventRepository } from '../event.repository';

@Injectable()
export class ValidateEventId implements PipeTransform {
  constructor(private readonly repository: EventRepository) {}

  async transform(value): Promise<number | ObjectLiteral> {
    const exists = !!(await this.repository.count({
      where: { id: value.id ? value.id : value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
