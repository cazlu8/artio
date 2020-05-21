import { EntityRepository, Repository } from 'typeorm';
import { Session } from './session.entity';
import { getFormattedTime, getSessionDayTitle } from './queries';

@EntityRepository(Session)
export class SessionRepository extends Repository<Session> {
  getSessionsFromEvent(eventId: number): Promise<any> {
    return this.createQueryBuilder('session')
      .select(['name'])
      .addSelect('place_name', 'placeName')
      .addSelect(getSessionDayTitle, 'dayTitle')
      .addSelect(getFormattedTime, 'startTime')
      .where(`"eventId" = ${eventId}`)
      .orderBy('session_date', 'ASC')
      .getRawMany();
  }
}
