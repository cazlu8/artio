import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { EventRepository } from '../event.repository';
import { LinkToEventWithRoleDTO } from '../../user/dto/user.linkToEventWithRole.dto';

@Injectable()
export class ValidateIfEventExists implements PipeTransform {
  constructor(private readonly repository: EventRepository) {}

  async transform(
    value: LinkToEventWithRoleDTO | string | number,
  ): Promise<LinkToEventWithRoleDTO | string | number> {
    const id = this.toValidate(value);
    const exists = !!(await this.repository.count({
      where: { id },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }

  private toValidate(value: any): number | string {
    if (typeof value === 'string' || typeof value === 'number') return value;
    const { id, eventId } = value;
    return id || eventId;
  }
}
