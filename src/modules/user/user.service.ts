import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, UpdateResult, Repository } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import { StringStream } from 'scramjet';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { s3Config, cognitoConfig } from '../../shared/config/AWS';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { UserRepository } from './user.repository';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { CheckUserExistsDto } from './dto/user.checkUserExists.dto';
import { UserEvents } from '../userEvents/userEvents.entity';
import { UserEventsRoles } from '../userEventsRoles/user.events.roles.entity';
import { Role } from '../role/role.entity';

const cognito = new AWS.CognitoIdentityServiceProvider(cognitoConfig());

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    @InjectRepository(UserEvents)
    private readonly userEventsRepository: Repository<UserEvents>,
    @InjectRepository(UserEventsRoles)
    private readonly userEventsRolesRepository: Repository<UserEventsRoles>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  findOne(guid: string): Promise<Partial<User> | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  updateUserInfo(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateResult> {
    return this.update(id, updateUserDto);
  }

  getUserGuid(id) {
    return this.repository.findOne({ select: ['guid'], where: { id } });
  }

  async exists(checkUserExistsDto: CheckUserExistsDto): Promise<boolean> {
    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: `email= "${checkUserExistsDto.email}"`,
    };
    const { Users }: any = await cognito.listUsers(params).promise();
    return Users.length > 0;
  }

  create(createUserDto: CreateUserDto): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createUserDto)
      .catch(err => validateEntityUserException.check(err));
  }

  async createAvatar(
    createAvatarDto: CreateAvatarDto,
  ): Promise<void | ObjectLiteral> {
    try {
      const { avatarImgUrl, id: userId } = createAvatarDto;
      const avatarId: string = uuid();
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
      const s3 = new AWS.S3(s3Config());
      const functions: any = [
        ...this.updateAvatarImage(s3, params, userId, avatarId),
        this.deleteAvatar(user, s3, Bucket),
      ];
      await Promise.all(functions);
      return {
        url: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
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

  private deleteAvatar(user: any, s3: AWS.S3, Bucket: string) {
    if (user?.avatarImgUrl) {
      const { avatarImgUrl: formerUrl } = user;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      return s3.deleteObject({ Bucket, Key: `${currentKey}` }).promise();
    }
    return Promise.resolve();
  }

  private updateAvatarImage(
    s3: AWS.S3,
    params: any,
    userId: number,
    avatarId: string,
  ) {
    return [
      s3.upload(params).promise(),
      this.update(userId, {
        avatarImgUrl: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
      }),
    ];
  }

  getAvatarUrl(id): Promise<Partial<User> | void> {
    return this.repository.findOne({
      select: ['avatarImgUrl'],
      where: { id },
    });
  }

  getUserByEmail(email): Promise<User | void> {
    return this.repository
      .findOneOrFail({
        where: { email },
      })
      .catch(error => {
        if (error.name === 'EntityNotFound') throw new NotFoundException();
        throw new InternalServerErrorException(error);
      });
  }

  async removeAvatar(id: number) {
    const getUserFromAvatar: any = this.repository.get({
      select: ['avatarImgUrl'],
      where: { id },
    });
    const updateAvatarUrl = this.repository.removeAvatarUrl(id);
    const s3 = new AWS.S3(s3Config());
    const Bucket = process.env.S3_BUCKET_AVATAR;
    await Promise.all([getUserFromAvatar, updateAvatarUrl]).then(
      async ([user]) => await this.deleteAvatar(user, s3, Bucket),
    );
  }

  async getEventsByUserId(id: number) {
    return this.repository.getEventsByUserId(id);
  }

  async bindUserEvent(data: {
    roleId: number;
    userId: number;
    eventId: number;
  }): Promise<boolean | void> {
    const { roleId, userId, eventId } = data;
    const bindUserToEvent = this.linkUserToEvent(userId, eventId).then(id =>
      this.linkUserAndRoleToEvent(id, roleId, userId, eventId),
    );
    const isRoleValid = this.verifyUserRole(roleId).then(haveRole => haveRole);
    return (await isRoleValid) && (await bindUserToEvent);
  }

  async bindUserEventCode(data): Promise<ObjectLiteral | void> {
    const { eventId, userEmail } = data;
    const ticketCode: string = uuid();
    const { id: userId } = await this.getUserIdByEmail(userEmail);
    const { id } = await this.linkUserAndCodeToEvent(
      ticketCode,
      userId,
      eventId,
    );
    return await this.linkUserAndRoleToEvent(id, 2, userId, eventId);
  }

  async redeemEventCode(data): Promise<UpdateResult> {
    const id = await this.repository.checkCode(data);
    return await this.repository.redeemEventCode(id);
  }

  async processCsvFile(file, eventId) {
    try {
      console.log(eventId);
      const s3 = new AWS.S3(s3Config());
      const id = uuid();
      const params = {
        Bucket: process.env.S3_BUCKET_CSV_USERS,
        Key: `${id}.csv`,
        Body: file.data,
        ACL: 'private',
        ContentEncoding: 'utf-8',
        ContentType: `text/csv`,
      };
      await s3.upload(params).promise();
      const readSTream = s3
        .getObject({
          Bucket: params.Bucket,
          Key: `${id}.csv`,
        })
        .createReadStream();
      StringStream.from(readSTream)
        .lines()
        .CSVParse()
        .do(async data => {
          console.log(data);
        });
    } catch (error) {
      throw new Error(error);
    }
  }

  private async verifyUserRole(id: number): Promise<boolean> {
    return !!(await this.roleRepository.count({ where: { id } }));
  }

  private async linkUserToEvent(userId: number, eventId: number): Promise<any> {
    return this.userEventsRepository
      .save({ userId, eventId, redeemed: true })
      .then(({ id }) => id);
  }

  private async linkUserAndCodeToEvent(
    ticketCode: string,
    userId: number,
    eventId: number,
  ): Promise<any> {
    return this.userEventsRepository.save({
      ticketCode,
      userId,
      eventId,
    });
  }

  private async linkUserAndRoleToEvent(
    userEventsId: number,
    roleId: number,
    userId: number,
    eventId: number,
  ): Promise<any> {
    return this.userEventsRolesRepository.save({
      userEventsId,
      roleId,
      userEventsUserId: userId,
      userEventsEventId: eventId,
    });
  }

  private getUserIdByEmail(email): Promise<User> {
    return this.repository
      .findOneOrFail({
        select: ['id'],
        where: { email },
      })
      .catch(error => {
        if (error.name === 'EntityNotFound') throw new NotFoundException();
        throw new InternalServerErrorException(error);
      });
  }

  private update(id: number, userData: Partial<User>): Promise<UpdateResult> {
    return this.repository.update(id, userData);
  }
}
