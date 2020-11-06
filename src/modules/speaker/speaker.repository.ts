import { EntityRepository, Repository } from 'typeorm';
import { Speaker } from './speaker.entity';

@EntityRepository(Speaker)
export class SpeakerRepository extends Repository<Speaker> {}
