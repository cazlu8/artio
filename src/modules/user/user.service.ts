import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, UpdateResult, Repository } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { StringStream } from 'scramjet';
import * as short from 'short-uuid';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider';
import S3 from 'aws-sdk/clients/s3';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { UserRepository } from './user.repository';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { CheckUserExistsDto } from './dto/user.checkUserExists.dto';
import { UserEvents } from '../userEvents/userEvents.entity';
import { UserEventsRoles } from '../userEventsRoles/user.events.roles.entity';
import { Role } from '../role/role.entity';
import { Event } from '../event/event.entity';
import { LoggerService } from '../../shared/services/logger.service';
import { UserEventsService } from '../userEvents/userEvents.service';
import { UserEventsRepository } from '../userEvents/userEvents.repository';

@Injectable()
export class UserService {
  private cognito: CognitoIdentityServiceProvider;

  private s3: S3;

  constructor(
    private readonly repository: UserRepository,
    private readonly userEventsService: UserEventsService,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: UserEventsRepository,
    @InjectRepository(UserEventsRoles)
    private readonly userEventsRolesRepository: Repository<UserEventsRoles>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly loggerService: LoggerService,
    private configService: ConfigService,
    @InjectQueue('user') private readonly userQueue: Queue,
  ) {
    this.cognito = new AWS.CognitoIdentityServiceProvider(
      this.configService.get('cognito'),
    );
    this.s3 = new AWS.S3(this.configService.get('s3'));
  }

  findOne(guid: string): Promise<Partial<User> | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
  }

  async updateUserInfo(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateResult> {
    const user = await this.update(id, updateUserDto);
    this.loggerService.info(`User ${id} updated`);
    return user;
  }

  getUserGuid(id) {
    return this.repository.findOne({ select: ['guid'], where: { id } });
  }

  async exists(checkUserExistsDto: CheckUserExistsDto): Promise<boolean> {
    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: `email= "${checkUserExistsDto.email}"`,
    };
    const { Users }: any = await this.cognito.listUsers(params).promise();
    return Users.length > 0;
  }

  async create(createUserDto: CreateUserDto): Promise<void | ObjectLiteral> {
    const newUser: any = { ...createUserDto };
    const user = await this.repository.get({
      where: { email: createUserDto.email },
      select: ['id'],
    });
    if (user?.id) {
      newUser.id = user.id;
    }
    return this.repository
      .save(newUser)
      .then(usr => this.loggerService.info(`User ${usr.id} Created`))
      .catch(err => validateEntityUserException.check(err));
  }

  async createAvatar(
    createAvatarDto: CreateAvatarDto,
  ): Promise<void | ObjectLiteral> {
    const { avatarImgUrl, id: userId } = createAvatarDto;
    const avatarId: string = short.generate();
    const { user, sharpedImage } = await this.processAvatarImage(
      avatarImgUrl,
      userId,
      avatarId,
    );
    const params = {
      Bucket: process.env.S3_BUCKET_AVATAR,
      Key: `${avatarId}.png`,
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64',
      ContentType: `image/png`,
    };
    const { Bucket } = params;
    const functions: any = [
      ...this.updateAvatarImage(params, userId, avatarId),
      this.deleteAvatar(user, Bucket),
    ];
    await Promise.all(functions);
    this.loggerService.info(`User Avatar id(${userId}) Created`);
    return {
      url: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
    };
  }

  private async processAvatarImage(
    avatarImgUrl: string,
    userId: number,
    avatarId: string,
  ): Promise<any> {
    await this.repository.findOneOrFail({ id: userId }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
    const base64Data = Buffer.from(handleBase64(avatarImgUrl), 'base64');
    const sharpedImage = await sharp(base64Data)
      .resize(400, 400)
      .png();
    const user: any = await this.repository.get({
      select: ['avatarImgUrl'],
      where: { id: userId },
    });
    return { sharpedImage, user, avatarId };
  }

  private deleteAvatar(user: any, Bucket: string) {
    if (user?.avatarImgUrl) {
      const { avatarImgUrl: formerUrl } = user;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      this.loggerService.info(`User Avatar ${formerUrl} was deleted`);
      return this.s3.deleteObject({ Bucket, Key: `${currentKey}` }).promise();
    }
    return Promise.resolve();
  }

  private updateAvatarImage(params: any, userId: number, avatarId: string) {
    return [
      this.s3.upload(params).promise(),
      this.update(userId, {
        avatarImgUrl: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
      }),
    ];
  }

  getAvatarUrl(id): Promise<Partial<User> | void> {
    return this.repository
      .findOneOrFail({
        select: ['avatarImgUrl'],
        where: { id },
      })
      .catch(error => {
        if (error.name === 'EntityNotFound') throw new NotFoundException();
      });
  }

  getUserByEmail(email): Promise<User | void> {
    return this.repository
      .findOneOrFail({
        where: { email },
      })
      .catch(error => {
        if (error.name === 'EntityNotFound') throw new NotFoundException();
      });
  }

  async removeAvatar(id: number) {
    await this.repository.findOneOrFail({ id }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
    const getUserFromAvatar: any = this.repository.get({
      select: ['avatarImgUrl'],
      where: { id },
    });
    const updateAvatarUrl = this.repository.removeAvatarUrl(id);
    const Bucket = process.env.S3_BUCKET_AVATAR;
    await Promise.all([getUserFromAvatar, updateAvatarUrl]).then(
      async ([user]) => await this.deleteAvatar(user, Bucket),
    );
  }

  async getEventsByUserId(id: number) {
    await this.repository.findOneOrFail({ id }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
    return await this.repository.getEventsByUserId(id);
  }

  async bindUserEvent(linkToEventWithRoleDTO: {
    roleId: number;
    userId: number;
    eventId: number;
  }): Promise<boolean | void> {
    const { roleId, userId, eventId } = linkToEventWithRoleDTO;
    await this.repository.findOneOrFail({ id: userId }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
    await this.eventRepository.findOneOrFail({ id: eventId }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
    });
    const bindUserToEvent = this.linkUserToEvent(userId, eventId).then(id =>
      this.linkUserAndRoleToEvent(id, roleId, userId, eventId),
    );
    const isRoleValid = this.verifyUserRole(roleId).then(haveRole => haveRole);
    return (await isRoleValid) && (await bindUserToEvent);
  }

  async redeemEventCode(redeemEventCodeDTO): Promise<UpdateResult> {
    const { userEvents_userId } = await this.userEventsService.checkCode(
      redeemEventCodeDTO,
    );
    const redeem = await this.userEventsService.redeemEventCode(
      userEvents_userId,
      redeemEventCodeDTO.ticketCode,
    );
    this.loggerService.info(
      `Code ${redeemEventCodeDTO.ticketCode} was redeemed by user ${redeemEventCodeDTO.userId}`,
    );
    return redeem;
  }

  async processCsvFile(file, eventId) {
    try {
      const id = short.generate();
      const params = {
        Bucket: process.env.S3_BUCKET_CSV_USERS,
        Key: `${id}.csv`,
        Body: file.data,
        ACL: 'private',
        ContentEncoding: 'utf-8',
        ContentType: `text/csv`,
      };
      await this.s3.upload(params).promise();
      const csvReadStream = this.s3
        .getObject({
          Bucket: params.Bucket,
          Key: `${id}.csv`,
        })
        .createReadStream();
      await this.readCsvUsers(csvReadStream, eventId);
      this.loggerService.info(`CSV file refering to ${eventId} was uploaded`);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async preSaveUsersAndBindToEvent(emails: string[], eventId: number) {
    const ticketCode = short.generate();
    const userIds: any[] = await this.preSaveUsers(emails);
    await this.userEventsService.bindUsersToEvent(userIds, eventId, ticketCode);
    return ticketCode;
  }

  async getUserEmailsBindedToEvent(emails: string[], eventId: number) {
    return await this.userEventsRepository.getUserEmailsBindedToEventByEmail(
      emails,
      eventId,
    );
  }

  private async preSaveUsers(emails: string[]) {
    const getUserId = email =>
      this.repository.get({ where: { email }, select: ['id'] });
    const preSaveUserFn = email =>
      this.repository.preSaveUser({ email }).then(({ raw }) => raw[0].id);
    const preSaveFns: any = emails.map(email =>
      getUserId(email).then(async id =>
        id !== undefined ? Promise.resolve(id) : await preSaveUserFn(email),
      ),
    );
    return await Promise.all(preSaveFns).then((...ids: any[]) =>
      ids.flatMap(x => {
        if (Array.isArray(x)) {
          return x.flatMap(y => (y.id !== undefined ? y.id : y));
        }
        return x.id !== undefined ? x.id : x;
      }),
    );
  }

  private readCsvUsers(csvReadStream, eventId: number) {
    return StringStream.from(csvReadStream)
      .setOptions({ maxParallel: 16 })
      .lines()
      .CSVParse()
      .map(emails => [...new Set([...emails])])
      .map(emails => emails.filter(x => x.trim().length > 1))
      .do(async (emails: string[]) => {
        await this.userQueue.add('preSaveUserAndBindToEvent', {
          emails: emails.filter(x => x.trim() !== ''),
          eventId,
        });
      });
  }

  private async verifyUserRole(id: number): Promise<boolean> {
    return !!(await this.roleRepository.count({ where: { id } }));
  }

  private async linkUserToEvent(userId: number, eventId: number): Promise<any> {
    return await this.userEventsRepository
      .save({ userId, eventId, redeemed: true })
      .then(({ id }) => id);
  }

  private async linkUserAndRoleToEvent(
    userEventsId: number,
    roleId: number,
    userId: number,
    eventId: number,
  ): Promise<any> {
    const linkUserAndRoleToEvent = await this.userEventsRolesRepository.save({
      userEventsId,
      roleId,
      userEventsUserId: userId,
      userEventsEventId: eventId,
    });
    this.loggerService.info(
      `User ${userId} has been linked to event ${eventId} with role ${roleId}, with redeem status = true;`,
    );
    return linkUserAndRoleToEvent;
  }

  private async update(
    id: number,
    userData: Partial<User>,
  ): Promise<UpdateResult> {
    const user = await this.repository.update(id, userData);
    this.loggerService.info(`User ${id} has been updated`);
    return user;
  }
}
