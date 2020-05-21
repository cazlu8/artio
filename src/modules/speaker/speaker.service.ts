import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { Speaker } from './speaker.entity';

@Injectable()
export class SpeakerService {
  constructor(
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
    private readonly loggerService: LoggerService,
  ) {}

  async findOne(id: number): Promise<Speaker | void> {
    return this.speakerRepository.findOne({ id });
  }
}
