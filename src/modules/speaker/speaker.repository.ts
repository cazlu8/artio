import { EntityRepository, Repository } from 'typeorm';
import { Speaker } from './speaker.entity';

@EntityRepository(Speaker)
export class SpeakerRepository extends Repository<Speaker> {
  getSpeakerFromEvent(eventId: number): Promise<Partial<Speaker[]>> {
    const attributes = [
      'speaker."avatar_img"',
      'speaker."first_name"',
      'speaker.bio',
    ];
    return this.createQueryBuilder('speaker')
      .select(attributes)
      .distinct()
      .leftJoin(
        'speaker_session',
        'speaker_session',
        'speaker_session."speakerId" = speaker.id',
      )
      .leftJoin(
        'session',
        'session',
        'session.id = speaker_session."sessionId"',
      )
      .leftJoin('event', 'event', `session."eventId" = ${eventId}`)
      .getRawOne();
  }
}
