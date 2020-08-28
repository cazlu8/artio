import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { EventRepository } from '../event.repository';

@Injectable()
export class ValidateEventId implements PipeTransform {
  constructor(private readonly repository: EventRepository) {}

  async transform(value: any) {
    try {
      await this.repository.findOneOrFail({
        where: { id: value.eventId ? value.eventId : value },
      });
      return value;
    } catch (error) {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    }
    return value;
  }
}
