import {
  EntityRepository,
  MoreThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Event } from './event.entity';
import {
  getFormattedDayOfWeekFromHappeningNow,
  getFormattedAddressQuery,
  getFormattedDateQuery,
  getFormattedDayOfWeek,
  getFormattedLocationQuery,
} from './queries';

@EntityRepository(Event)
export class EventRepository extends Repository<Event> {
  getHappeningNowEvents(): Promise<Partial<Event[]> | void> {
    const where = 'event.start_date <= now() and event.end_date > now()';
    return this.getListEvents(where)
      .addSelect(getFormattedDayOfWeek, 'day')
      .getRawMany();
  }

  getUpcomingEvents(skip: number): Promise<Partial<Event[]> | void> {
    const where = 'event.start_date > now() and event.end_date > now()';
    return this.getListEvents(where)
      .skip(skip)
      .take(10)
      .getRawMany();
  }

  getEventDetails(eventId: number): Promise<Partial<Event> | void> {
    const attributes = ['id'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .addSelect('name', 'title')
      .addSelect('location_name', 'locationName')
      .addSelect('additional_info', 'additionalInfo')
      .addSelect(getFormattedDayOfWeekFromHappeningNow, 'day')
      .addSelect(getFormattedAddressQuery, 'address')
      .where(`id = ${eventId}`)
      .getRawOne();
  }

  getUpcomingCount() {
    const now: string = new Date().toISOString();
    return this.count({
      where: {
        startDate: MoreThan(now),
        endDate: MoreThan(now),
      },
    });
  }

  // private functions
  private getListEvents(where: string): SelectQueryBuilder<Partial<Event>> {
    const attributes = ['id'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .addSelect('name', 'title')
      .addSelect('hero_img_url', 'heroImgUrl')
      .addSelect(getFormattedDateQuery, 'date')
      .addSelect(getFormattedLocationQuery, 'location')
      .orderBy('start_date', 'DESC')
      .where(where);
  }
}
