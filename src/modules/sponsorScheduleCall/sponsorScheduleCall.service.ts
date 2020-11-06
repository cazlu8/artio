import { Injectable } from '@nestjs/common';
import * as groupBy from 'group-by';
import { SponsorScheduleCallRepository } from './sponsorScheduleCall.repository';

@Injectable()
export class SponsorScheduleCallService {
  constructor(private readonly repository: SponsorScheduleCallRepository) {}

  async getScheduleCalls(
    sponsorId: number,
  ): Promise<SponsorScheduleCallService[]> {
    const scheduleCalls = await this.repository.getScheduleCalls(sponsorId);
    return groupBy(scheduleCalls, 'day');
  }
}
