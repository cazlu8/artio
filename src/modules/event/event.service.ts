import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectLiteral, UpdateResult } from 'typeorm';
import { Event } from './event.entity';
import { EventRepository } from './event.repository';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';
import EventPastListDto from './dto/event.past.dto';
import CreateEventDTO from './dto/event.create.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import UpdateEventDTO from './dto/event.update.dto';

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

  getPastEvents(skip: number): Promise<EventPastListDto> {
    const getCount: Promise<number> = this.repository.getPastCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getPastEvents(skip);
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

  getEvent(id: number): Promise<Partial<Event> | void> {
    return this.repository.findOneOrFail({ id }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  getEvents(): Promise<Partial<Event[]> | void> {
    return this.repository.find().catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  updateEventInfo(
    id: number,
    updateEventDTO: UpdateEventDTO,
  ): Promise<UpdateResult> {
    return this.update(id, updateEventDTO);
  }

  async getUserEventsByRole(userId: number, roleId: number) {
    return this.repository.getUserEventsByRole(userId, roleId);
  }

  async getHappeningNowByUser(userId: number) {
    return this.repository.getHappeningNowByUser(userId);
  }

  async getUpcomingByUser(userId: number, skip: number) {
    const getCount: Promise<number> = this.repository.getUpcomingCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getUpcomingByUser(userId, skip);
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

  async getPastByUser(userId: number, skip: number) {
    const getCount: Promise<number> = this.repository.getPastCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getPastByUser(userId, skip);
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

  private update(id: number, eventData: Partial<Event>): Promise<UpdateResult> {
    return this.repository.update(id, eventData);
  }
}
