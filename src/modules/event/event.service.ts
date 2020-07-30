import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import * as sharp from 'sharp';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventRepository } from './event.repository';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import EventUpcomingListDto from './dto/event.upcoming.dto';
import EventPastListDto from './dto/event.past.dto';
import CreateEventDTO from './dto/event.create.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import UpdateEventDTO from './dto/event.update.dto';
import { s3Config } from '../../shared/config/AWS';
import { CreateHeroImage } from './dto/event.create.heroImage.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { catchError } from '../../shared/utils/errorHandler.utils';
import { NetworkRoomService } from '../networkRoom/networkRoom.service';
import { NetworkRoomGateway } from '../networkRoom/networkRoom.gateway';
import { UserEvents } from '../userEvents/userEvents.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly networkRoomService: NetworkRoomService,
    @InjectQueue('event') private readonly eventQueue: Queue,
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly networkRoomGateway: NetworkRoomGateway,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: Repository<UserEvents>,
  ) {}

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
    return this.paginateEvents(getCount, getEvents, skip);
  }

  getPastEvents(skip: number): Promise<EventPastListDto> {
    const getCount: Promise<number> = this.repository.getPastCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getPastEvents(skip);
    return this.paginateEvents(getCount, getEvents, skip);
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
    return this.paginateEvents(getCount, getEvents, skip);
  }

  async getPastByUser(userId: number, skip: number) {
    const getCount: Promise<number> = this.repository.getPastCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getPastByUser(userId, skip);
    return this.paginateEvents(getCount, getEvents, skip);
  }

  async startIntermission(eventId: number) {
    try {
      const addCreateRoomOnQueue = this.networkRoomService.addCreateRoomOnQueue(
        eventId,
      );
      const emitStartIntermissionToAllSockets = () =>
        this.networkRoomGateway.server.sockets.emit(`startIntermission`, true);
      return await Promise.all([
        addCreateRoomOnQueue,
        emitStartIntermissionToAllSockets,
      ]);
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  async finishIntermission(eventId: number) {
    try {
      const addClearIntermissionDataOnQueue = this.eventQueue.add(
        'clearIntermissionData',
        { eventId },
        {
          priority: 2,
        },
      );
      const emitSendIntermissionToAllSockets = () =>
        this.networkRoomGateway.server.sockets.emit(`endIntermission`, true);
      return await Promise.all([
        addClearIntermissionDataOnQueue,
        emitSendIntermissionToAllSockets,
      ]);
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  getSubscribed(eventId) {
    return this.userEventsRepository.count({
      where: { eventId: `${eventId}` },
    });
  }

  async finishLive(eventId) {
    return eventId;
  }

  async startLive(eventId) {
    return eventId;
  }

  async removeHeroImage(id: number) {
    const user: any = await this.repository.get({
      select: ['heroImgUrl'],
      where: { id },
    });
    await this.repository.removeHeroImage(id);
    const s3 = new AWS.S3(s3Config());
    const Bucket = process.env.S3_BUCKET_HERO_IMAGE;
    await this.deleteHeroImage(user, s3, Bucket);
  }

  private deleteHeroImage(event: any, s3: AWS.S3, Bucket: string) {
    if (event?.heroImgUrl) {
      const { heroImgUrl: formerUrl } = event;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      return s3.deleteObject({ Bucket, Key: `${currentKey}` }).promise();
    }
    return Promise.resolve();
  }

  async createHeroImage(
    createHeroImage: CreateHeroImage,
  ): Promise<void | ObjectLiteral> {
    try {
      const { heroImageUrl, id: eventId } = createHeroImage;
      const heroImageId: string = uuid();
      const { user, sharpedImage } = await this.processAvatarImage(
        heroImageUrl,
        eventId,
        heroImageId,
      );
      const params = {
        Bucket: process.env.S3_BUCKET_HERO_IMAGE,
        Key: `${heroImageId}.png`,
        Body: sharpedImage,
        ACL: 'private',
        ContentEncoding: 'base64',
        ContentType: `image/png`,
      };
      const { Bucket } = params;
      const s3 = new AWS.S3(s3Config());
      const functions: any = [
        ...this.updateAvatarImage(s3, params, eventId, heroImageId),
        this.deleteHeroImage(user, s3, Bucket),
      ];
      await Promise.all(functions);
      return {
        url: `${process.env.S3_BUCKET_HERO_IMAGE_PREFIX_URL}${heroImageId}.png`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private async processAvatarImage(
    heroImageUrl: string,
    eventId: number,
    heroImageId: string,
  ): Promise<any> {
    const base64Data = Buffer.from(handleBase64(heroImageUrl), 'base64');
    const sharpedImage = await sharp(base64Data)
      .resize(600, 375)
      .png();
    const user: any = await this.repository.get({
      select: ['heroImgUrl'],
      where: { id: eventId },
    });
    return { sharpedImage, user, heroImageId };
  }

  private updateAvatarImage(
    s3: AWS.S3,
    params: any,
    eventId: number,
    heroImageId: string,
  ) {
    return [
      s3.upload(params).promise(),
      this.update(eventId, {
        heroImgUrl: `${process.env.S3_BUCKET_HERO_IMAGE_PREFIX_URL}${heroImageId}.png`,
      }),
    ];
  }

  private paginateEvents(
    getCount: Promise<number>,
    getEvents: Promise<Partial<Event[]> | void>,
    skip: number,
  ) {
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
