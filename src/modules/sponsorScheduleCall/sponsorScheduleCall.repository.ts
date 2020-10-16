import { EntityRepository, Repository } from 'typeorm';
import { SponsorScheduleCall } from './sponsorScheduleCall.entity';
import { getDay, getDayNumberMonth, getTime } from './queries';

@EntityRepository(SponsorScheduleCall)
export class SponsorScheduleCallRepository extends Repository<
  SponsorScheduleCall
> {
  getScheduleCalls(sponsorId: number) {
    return this.createQueryBuilder('sponsorScheduleCall')
      .select(['id'])
      .addSelect(getDay, 'day')
      .addSelect(getTime, 'hour')
      .addSelect(getDayNumberMonth, 'dayNumber')
      .where('sponsorScheduleCall.sponsorId = :sponsorId', { sponsorId })
      .getRawMany();
  }
}
