import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { LoggerService } from '../../shared/services/logger.service';
import { Speaker } from './speaker.entity';
import { SpeakerRepository } from './speaker.repository';
import SpeakerEventDTO from './dto/speaker.event.dto';

@Injectable()
export class SpeakerService {
  constructor(
    private readonly repository: SpeakerRepository,
    private readonly loggerService: LoggerService,
  ) {}

  async getSpeakerFromEvent(
    eventId: number,
  ): Promise<SpeakerEventDTO[] | void> {
    return await this.repository
      .getSpeakerFromEvent(eventId)
      .then((speakers: Partial<Speaker[]>) =>
        plainToClass(SpeakerEventDTO, speakers),
      );
  }
}
