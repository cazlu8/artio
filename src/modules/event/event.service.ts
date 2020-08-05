import {
  BadRequestException,
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
import { RedisService } from 'nestjs-redis';
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
import { NetworkRoomService } from '../networkRoom/networkRoom.service';
import { UserEvents } from '../userEvents/userEvents.entity';
import EventStartIntermissionDto from './dto/event.startIntermission.dto';
import { EventGateway } from './event.gateway';

@Injectable()
export class EventService {
  private redisClient: any;

  constructor(
    private readonly repository: EventRepository,
    private readonly networkRoomService: NetworkRoomService,
    @InjectQueue('event') private readonly eventQueue: Queue,
    private readonly eventGateway: EventGateway,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: Repository<UserEvents>,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getClient();
  }

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

  async getEvent(id: number): Promise<ObjectLiteral | void> {
    const getSubscribers = this.userEventsRepository.count({
      where: { eventId: `${id}` },
    });
    const getEvents = this.repository.findOneOrFail({ id });
    return await Promise.all([getEvents, getSubscribers]).then(
      ([events, subscribers]) => ({
        ...events,
        subscribers,
      }),
    );
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

  async startIntermission(
    eventStartIntermissionDto: EventStartIntermissionDto,
  ) {
    const { eventId, intermissionTime } = eventStartIntermissionDto;
    if (!(await this.eventIsOnIntermission(eventId))) {
      const addCreateRoomOnQueue = this.networkRoomService.addCreateRoomOnQueue(
        eventId,
      );
      const addFinishIntermissionToQueue = this.finishIntermission(
        eventId,
        intermissionTime,
      );
      await Promise.all([
        addCreateRoomOnQueue,
        addFinishIntermissionToQueue,
      ]).then(async () => {
        this.eventGateway.server.emit('startIntermission', true);
        await this.redisClient.set(`event-${eventId}:isOnIntermission`, true);
      });
    }
  }

  async finishIntermission(eventId: number, intermissionTime = 0) {
    await this.eventQueue.add(
      'endIntermission',
      { eventId },
      { delay: intermissionTime * 60000 },
    );

    this.eventGateway.server.emit('endIntermission', true);
  }

  async getIntermissionStatus(eventId: number): Promise<boolean> {
    return !!(await this.redisClient.get(`event-${eventId}:isOnIntermission`));
  }

  async finishLive(eventId) {
    const eventToUpdate = await this.repository.findOne(eventId);
    eventToUpdate.onLive = false;
    return await this.repository.save(eventToUpdate);
  }

  async startLive(eventId) {
    const eventToUpdate = await this.repository.findOne(eventId);
    eventToUpdate.onLive = true;
    return await this.repository.save(eventToUpdate);
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

  private deleteHeroImage(event: any, s3: AWS.S3, Bucket: string) {
    if (event?.heroImgUrl) {
      const { heroImgUrl: formerUrl } = event;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      return s3.deleteObject({ Bucket, Key: `${currentKey}` }).promise();
    }
    return Promise.resolve();
  }

  private async processAvatarImage(
    heroImageUrl: string,
    eventId: number,
    heroImageId: string,
  ): Promise<any> {
    const base64Data = Buffer.from(handleBase64(heroImageUrl), 'base64');
    const sharpedImage = await sharp(base64Data)
      .resize(800, 600)
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

  private async eventIsOnIntermission(eventId: number) {
    const isOnIntermission = await this.redisClient.get(
      `event-${eventId}:isOnIntermission`,
    );
    if (isOnIntermission) {
      throw new BadRequestException(
        `event ${eventId} is already on intermission`,
      );
    }
    return false;
  }
}
