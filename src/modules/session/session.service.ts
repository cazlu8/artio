import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Session } from './session.entity';
import { SessionRepository } from './session.repository';
import SessionListDTO from './dto/session.list.dto';

@Injectable()
export class SessionService {
  constructor(private readonly repository: SessionRepository) {}

  async getSessionsFromEvent(
    eventId: number,
  ): Promise<SessionListDTO[] | void> {
    return await this.repository
      .getSessionsFromEvent(eventId)
      .then((sessions: Partial<Session[]>) =>
        plainToClass(SessionListDTO, sessions, {
          excludeExtraneousValues: true,
        }),
      );
  }
}
