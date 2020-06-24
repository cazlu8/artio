import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectLiteral } from 'typeorm';
import { Event } from './event.entity';
import { EventRepository } from './event.repository';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';
import CreateEventDTO from './dto/event.create.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';

@Injectable()
export class EventService {
  constructor(private readonly repository: EventRepository) {}

  create(createEventDTO: CreateEventDTO): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createEventDTO)
      .catch(err => validateEntityUserException.check(err));
  }

  getHappeningNowEvents(): Promise<EventListDto[] | void> {
    return this.repository
      .getHappeningNowEvents()
      .then((events: Partial<Event[]>) => plainToClass(EventListDto, events));
  }

  getUpcomingEvents(skip: number): Promise<EventUpcomingListDto> {
    const getCount: Promise<number> = this.repository.getUpcomingCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getUpcomingEvents(skip);
    return Promise.all([getCount, getEvents]).then(([amount, events]) => {
      const eventList: EventListDto[] = plainToClass(
        EventListDto,
        events as Event[],
      );
      return {
        events: eventList,
        skip: skip + eventList.length,
        ended: (skip || 1) >= amount,
      };
    });
  }

  getEventDetails(eventId: number): Promise<EventDetailsDTO> {
    return this.repository
      .getEventDetails(eventId)
      .then((event: Partial<Event>) => plainToClass(EventDetailsDTO, event));
  }
}
