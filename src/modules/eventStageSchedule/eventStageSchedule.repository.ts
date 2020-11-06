import { EntityRepository, Repository } from 'typeorm';
import { EventStageSchedule } from './eventStageSchedule.entity';
import { getFormattedDateQuery } from './queries';

@EntityRepository(EventStageSchedule)
export class EventStageScheduleRepository extends Repository<
  EventStageSchedule
> {
  getScheduleFromStage(eventStageId: number) {
    return this.createQueryBuilder('eventStageSchedule')
      .select(['id', 'title'])
      .addSelect(getFormattedDateQuery, 'formattedDate')
      .where('eventStageSchedule.eventStageId = :eventStageId', {
        eventStageId,
      })
      .getRawMany();
  }

  verifyIfScheduleIsInBetween(startDate: Date) {
    return this.createQueryBuilder('eventStageSchedule')
      .select(['id'])
      .where(`:startDate >= start_date and :startDate <= end_date`, {
        startDate,
      })
      .getRawMany();
  }

  async updateDateByTimezone(eventStageIds: number[], timezone: string) {
    return this.createQueryBuilder('eventStageSchedule')
      .update(EventStageSchedule)
      .set({
        startDate: () => `timezone('${timezone}', start_date)`,
        endDate: () => `timezone('${timezone}', end_date)`,
      })

      .where('eventStageId in (:...ids)', {
        ids: eventStageIds,
      })
      .execute();
  }
}
