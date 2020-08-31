import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { SponsorRepository } from '../sponsor.repository';

@Injectable()
export class ValidateSponsorGUID implements PipeTransform {
  constructor(private readonly repository: SponsorRepository) {}

  async transform(value: string): Promise<string> {
    const exists = !!(await this.repository.count({
      where: { guid: value },
    }));
    if (!exists) throw new NotFoundException();
    return value;
  }
}
