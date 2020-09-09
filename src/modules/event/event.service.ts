import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import { uuid } from 'uuidv4';
import * as sharp from 'sharp';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'nestjs-redis';
import * as bluebird from 'bluebird';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { Event } from './event.entity';
import { EventRepository } from './event.repository';
import EventListDto from './dto/event.list.dto';
import EventDetailsDTO from './dto/event.details.dto';
import UpdateEventDTO from './dto/event.update.dto';
import CreateHeroImage from './dto/event.create.heroImage.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { NetworkRoomService } from '../networkRoom/networkRoom.service';
import { UserEvents } from '../userEvents/userEvents.entity';
import EventStartIntermissionDto from './dto/event.startIntermission.dto';
import { EventGateway } from './event.gateway';
import { LoggerService } from '../../shared/services/logger.service';
import { UploadService } from '../../shared/services/upload.service';

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
    private readonly uploadService: UploadService,
    private readonly loggerService: LoggerService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  getUpcomingEvents(skip: number): Promise<EventListDto[] | void> {
    const getCount: Promise<number> = this.repository.getUpcomingCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getUpcomingEvents(skip);
    return this.paginateEvents(getCount, getEvents, skip);
  }

  getPastEvents(
    skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
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

  updateEventInfo(
    id: number,
    updateEventDTO: UpdateEventDTO,
  ): Promise<UpdateResult> {
    return this.update(id, updateEventDTO);
  }

  getUpcomingByUser(
    userId: number,
    skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
    const getCount: Promise<number> = this.repository.getUpcomingCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getUpcomingByUser(userId, skip);
    return this.paginateEvents(getCount, getEvents, skip);
  }

  getPastByUser(
    userId: number,
    skip: number,
  ): Promise<{ ended: boolean; skip: number; events: EventListDto[] }> {
    const getCount: Promise<number> = this.repository.getPastCount();
    const getEvents: Promise<Partial<
      Event[]
    > | void> = this.repository.getPastByUser(userId, skip);
    return this.paginateEvents(getCount, getEvents, skip);
  }

  async startIntermission(
    eventStartIntermissionDto: EventStartIntermissionDto,
  ): Promise<void> {
    const { eventId, intermissionTime } = eventStartIntermissionDto;
    if (!(await this.eventIsOnIntermission(eventId))) {
      const [addCreateRoomOnQueueFn] = this.addRoomsToQueue(eventId);
      const [
        setIntermissionStartedAtFn,
        setIntermissionTimeFn,
        setIntermissionOnFn,
      ] = this.setIntermissionData(eventId, intermissionTime);
      await Promise.all([
        addCreateRoomOnQueueFn,
        setIntermissionOnFn,
        setIntermissionStartedAtFn,
        setIntermissionTimeFn,
      ]);
      await this.finishIntermission(eventId, intermissionTime);
      this.eventGateway.server.emit('startIntermission', { eventId });
    } else
      throw new BadRequestException(
        `event ${eventId} is already on intermission`,
      );
  }

  async finishIntermission(
    eventId: number,
    intermissionTime = 0,
  ): Promise<void> {
    if (await this.eventIsOnIntermission(eventId)) {
      await this.eventQueue.add(
        'endIntermission',
        { eventId },
        { delay: intermissionTime * 60000 },
      );
    } else
      throw new BadRequestException(`event ${eventId} is not on intermission`);
  }

  async getIntermissionStatus(
    eventId: number,
  ): Promise<ObjectLiteral | boolean> {
    const ongoing = !!(await this.redisClient.get(
      `event-${eventId}:isOnIntermission`,
    ));
    if (ongoing) {
      const getStartedAtFn = this.redisClient.get(
        `event-${eventId}:intermissionStartedAt`,
      );
      const getDurationFn = this.redisClient.get(
        `event-${eventId}:intermissionTime`,
      );
      const [startedAt, duration] = await Promise.all([
        getStartedAtFn,
        getDurationFn,
      ]);
      return { ongoing, startedAt, duration };
    }
    return false;
  }

  async removeHeroImage(id: number): Promise<void> {
    const user: any = await this.repository.get({
      select: ['heroImgUrl'],
      where: { id },
    });
    const bucket = process.env.S3_BUCKET_HERO_IMAGE;
    const removeHeroImgFn = this.repository.removeHeroImage(id);
    const removeAssetImgFn = this.deleteHeroImage(user, bucket);
    await Promise.all([removeHeroImgFn, removeAssetImgFn]);
  }

  async createHeroImage(
    createHeroImage: CreateHeroImage,
  ): Promise<void | ObjectLiteral> {
    const { heroImageUrl, id: eventId } = createHeroImage;
    const heroImageId: string = uuid();
    const { event, sharpedImage } = await this.processHeroImage(
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
    const functions: any = [
      ...this.updateHeroImage(params, eventId, heroImageId),
      this.deleteHeroImage(event, Bucket),
    ];
    await Promise.all(functions);
    this.loggerService.info(
      `Event hero image for event id(${eventId}) was created`,
    );
    return {
      url: `${process.env.S3_BUCKET_HERO_IMAGE_PREFIX_URL}${heroImageId}.png`,
    };
  }

  private setIntermissionData(eventId: number, intermissionTime: number) {
    return [
      this.redisClient.set(
        `event-${eventId}:intermissionStartedAt`,
        new Date().toISOString(),
      ),
      this.redisClient.set(
        `event-${eventId}:intermissionTime`,
        intermissionTime,
      ),
      this.redisClient.set(`event-${eventId}:isOnIntermission`, true),
    ];
  }

  private addRoomsToQueue(eventId: number) {
    return [this.networkRoomService.addCreateRoomOnQueue(eventId)];
  }

  private deleteHeroImage(
    event: Event,
    Bucket: string,
  ): Promise<PromiseResult<S3.DeleteObjectOutput, AWSError> | void> {
    if (event?.heroImgUrl) {
      const { heroImgUrl: formerUrl } = event;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      this.loggerService.info(`Event Hero Image ${formerUrl} was deleted`);
      return this.uploadService.deleteObject({ Bucket, Key: `${currentKey}` });
    }
    return Promise.resolve();
  }

  private async processHeroImage(
    heroImageUrl: string,
    eventId: number,
    heroImageId: string,
  ): Promise<any> {
    const base64Data = Buffer.from(handleBase64(heroImageUrl), 'base64');
    const sharpedImage = await sharp(base64Data)
      .resize(800, 600)
      .png();
    const event: any = await this.repository.get({
      select: ['heroImgUrl'],
      where: { id: eventId },
    });
    return { sharpedImage, event, heroImageId };
  }

  private updateHeroImage(
    params: any,
    eventId: number,
    heroImageId: string,
  ): (Promise<ManagedUpload.SendData> | Promise<UpdateResult>)[] {
    return [
      this.uploadService.uploadObject(params),
      this.update(eventId, {
        heroImgUrl: `${process.env.S3_BUCKET_HERO_IMAGE_PREFIX_URL}${heroImageId}.png`,
      }),
    ];
  }

  private paginateEvents(
    getCount: Promise<number>,
    getEvents: Promise<Partial<Event[]> | void>,
    skip: number,
  ): Promise<any> {
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

  private async update(
    id: number,
    eventData: Partial<Event>,
  ): Promise<UpdateResult> {
    const event = await this.repository.update(id, eventData);
    this.loggerService.info(`Event ${id} has been updated`);
    return event;
  }

  private async eventIsOnIntermission(eventId: number): Promise<boolean> {
    const isOnIntermission = await this.redisClient.get(
      `event-${eventId}:isOnIntermission`,
    );
    return !!isOnIntermission;
  }
}
