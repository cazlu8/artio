import {
  EntityRepository,
  MoreThan,
  LessThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Event } from './event.entity';
import {
  getFormattedDayOfWeekFromHappeningNow,
  getFormattedAddressQuery,
} from './queries';

@EntityRepository(Event)
export class EventRepository extends Repository<Event> {
  getHappeningNowEvents(): Promise<Partial<Event[]> | void> {
    const where = 'event.start_date <= now() and event.end_date >= now()';
    const order = 'DESC';
    return this.getListEvents(where, order).getRawMany();
  }

  getUpcomingEvents(skip: number): Promise<Partial<Event[]> | void> {
    const where = 'event.start_date > now() and event.end_date > now()';
    const order = 'DESC';
    return this.getListEvents(where, order)
      .skip(skip)
      .take(10)
      .getRawMany();
  }

  getPastEvents(skip: number): Promise<Partial<Event[]> | void> {
    const where = 'event.start_date < now() and event.end_date < now()';
    const order = 'ASC';
    return this.getListEvents(where, order)
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

  getPastCount() {
    const now: string = new Date().toISOString();
    return this.count({
      where: {
        startDate: LessThan(now),
        endDate: LessThan(now),
      },
    });
  }

  // private functions
  private getListEvents(where: string, order: any): SelectQueryBuilder<Event> {
    const attributes = ['*'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .orderBy('start_date', order)
      .where(where);
  }

  getUserEventsByRole(userId: number, roleId: number) {
    const attributes = ['*'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('"userEventsEventId"')
          .from('user_events_roles', 'userEventsRoles')
          .where(`"userEventsUserId" = :userId and "roleId" = :roleId`)
          .getQuery();
        return `id IN ${subQuery}`;
      })
      .setParameters({ userId, roleId })
      .getRawMany();
  }

  getHappeningNowByUser(userId: number) {
    const attributes = ['*'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .orderBy('start_date', 'DESC')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('"eventId"')
          .from('user_events', 'userEvents')
          .where(
            '"userId" = :userId and event.start_date <= now() and event.end_date >= now()',
          )
          .getQuery();
        return `id IN ${subQuery}`;
      })
      .setParameters({ userId })
      .getRawMany();
  }

  getUpcomingByUser(userId: number, skip: number) {
    const attributes = ['*'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .orderBy('start_date', 'DESC')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('"eventId"')
          .from('user_events', 'userEvents')
          .where(
            '"userId" = :userId and event.start_date > now() and event.end_date > now()',
          )
          .skip(skip)
          .take(10)
          .getQuery();
        return `id IN ${subQuery}`;
      })
      .setParameters({ userId })
      .getRawMany();
  }

  getPastByUser(userId: number, skip: number) {
    const attributes = ['*'];
    return this.createQueryBuilder('event')
      .select(attributes)
      .orderBy('start_date', 'DESC')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('"eventId"')
          .from('user_events', 'userEvents')
          .where(
            '"userId" = :userId and event.start_date < now() and event.end_date < now()',
          )
          .skip(skip)
          .take(10)
          .getQuery();
        return `id IN ${subQuery}`;
      })
      .setParameters({ userId })
      .getRawMany();
  }
}
