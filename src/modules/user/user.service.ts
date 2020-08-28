import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ObjectLiteral,
  UpdateResult,
  Repository,
  In,
  Transaction,
  TransactionRepository,
} from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { StringStream } from 'scramjet';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { ConfigService } from '@nestjs/config';
import * as short from 'short-uuid';
import { validate as validateEmail } from 'email-validator';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { UserRepository } from './user.repository';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { CheckUserExistsDto } from './dto/user.checkUserExists.dto';
import { UserEventsRoles } from '../userEventsRoles/userEventsRoles.entity';
import { Role } from '../role/role.entity';
import { LoggerService } from '../../shared/services/logger.service';
import { UserEventsService } from '../userEvents/userEvents.service';
import { UserEventsRepository } from '../userEvents/userEvents.repository';
import { EventRepository } from '../event/event.repository';
import { UserEvents } from '../userEvents/userEvents.entity';
import { Event } from '../event/event.entity';
import { UploadService } from '../../shared/services/uploadService';
@Injectable()
export class UserService {
  private cognito: CognitoIdentityServiceProvider;

  constructor(
    private readonly repository: UserRepository,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: UserEventsRepository,
    @InjectRepository(UserEventsRoles)
    private readonly userEventsRolesRepository: Repository<UserEventsRoles>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Event)
    private readonly eventRepository: EventRepository,
    private readonly uploadService: UploadService,
    private readonly loggerService: LoggerService,
    private readonly userEventsService: UserEventsService,
    private configService: ConfigService,
    @InjectQueue('user') private readonly userQueue: Queue,
  ) {
    this.cognito = new AWS.CognitoIdentityServiceProvider(
      this.configService.get('cognito'),
    );
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
    if (typeof user === 'undefined' || user.isNew) {
      return this.repository
        .save(newUser)
        .then(usr => this.loggerService.info(`User ${usr.id} Created`))
        .catch(err => validateEntityUserException.check(err));
    }
    return Promise.resolve();
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
      return this.uploadService.deleteObject({ Bucket, Key: `${currentKey}` });
    }
    return Promise.resolve();
  }

  private updateAvatarImage(params: any, userId: number, avatarId: string) {
    return [
      this.uploadService.uploadObject(params),
      this.update(userId, {
        avatarImgUrl: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
      }),
    ];
  }

  async removeAvatar(id: number) {
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

  async bindUserEvent(linkToEventWithRoleDTO: {
    roleId: number;
    userId: number;
    eventId: number;
  }): Promise<boolean | void> {
    const { roleId, userId, eventId } = linkToEventWithRoleDTO;
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

  async processCsvFile(readStream, eventId) {
    try {
      await this.readCsvUsers(readStream, eventId);
      this.loggerService.info(`CSV file referring to ${eventId} was uploaded`);
    } catch (error) {
      throw new UnprocessableEntityException(error);
    }
  }

  @Transaction()
  async preSaveUsersAndBindToEvent(
    emails: string[],
    eventId: number,
    @TransactionRepository()
    userTransactionRepository?: UserRepository,
    @TransactionRepository()
    userEventsTransactionRepository?: UserEventsRepository,
  ) {
    const userIds: number[] = await this.preSaveUsers(
      emails,
      userTransactionRepository,
    );
    return await this.bindUsersToEvent(
      userIds,
      eventId,
      userEventsTransactionRepository,
    );
  }

  async filterAlreadyRegisteredEmails(
    emails: string[],
    eventId: number,
  ): Promise<string[]> {
    const emailsToNotSend = (
      await this.userEventsRepository.getUserEmailsBindedToEventByEmail(
        emails,
        eventId,
      )
    )?.map(x => x.user_email);
    return emailsToNotSend.length
      ? emails.filter(x => !emailsToNotSend.some(y => x === y))
      : emails;
  }

  private async readCsvUsers(csvReadStream, eventId: number) {
    await StringStream.from(csvReadStream)
      .setOptions({ maxParallel: 16 })
      .lines()
      .CSVParse()
      .map(emails => [...new Set(emails)])
      .map(emails =>
        emails.filter(x => validateEmail(x) && x.trim().length > 1),
      )
      .do((emails: string[]) => {
        if (emails?.length)
          this.userQueue.add('preSaveUserAndBindToEvent', {
            emails,
            eventId,
          });
      })
      .run();
  }

  private async preSaveUsers(
    emailsToSave: string[],
    userTransactionRepository: UserRepository,
  ) {
    if (!emailsToSave.length) return [];
    const mapToId = (users: any) =>
      (users?.raw || users)?.length
        ? (users.raw || users).map(({ id }) => id)
        : [];
    const usersToSave = emailsToSave.map(email => ({ email }));
    const alreadyExistsUserIds = userTransactionRepository
      .find({
        where: { email: In(emailsToSave) },
        select: ['id'],
      })
      .then(mapToId);
    const savedUsers = userTransactionRepository
      .preSaveUser(usersToSave)
      .then(mapToId);
    const [existingIds, newIds] = await Promise.all([
      alreadyExistsUserIds,
      savedUsers,
    ]);
    return [...existingIds, ...newIds];
  }

  private async bindUsersToEvent(
    userIds: number[],
    eventId: number,
    userEventsTransactionRepository: UserEventsRepository,
  ) {
    const { guid: ticketCode } = await this.eventRepository.findOne({
      where: { id: eventId },
      select: ['guid'],
    });
    const userEvents = userIds.map(userId => ({
      userId,
      eventId,
      ticketCode,
    }));
    await userEventsTransactionRepository.save(userEvents);
    return ticketCode;
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
