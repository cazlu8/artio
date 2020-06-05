import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ObjectLiteral, UpdateResult } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { s3Config } from '../../shared/config/AWS';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  findOne(guid: string): Promise<User | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound')
        throw new UnprocessableEntityException();
      throw new InternalServerErrorException(error);
    });
  }

  updateUserInfo(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateResult> {
    return this.update(id, updateUserDto);
  }

  update(id: number, userData: Partial<User>): Promise<UpdateResult> {
    return this.repository.update(id, userData);
  }

  getUserGuid(id) {
    return this.repository.findOne({ select: ['guid'], where: { id } });
  }

  exists(properties: {}): Promise<boolean> {
    return this.repository.exists(properties);
  }

  create(createUserDto: CreateUserDto): Promise<void | ObjectLiteral> {
    return this.repository.save(createUserDto).catch(err => console.log(err));
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
      return { url: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}` };
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
      return s3.deleteObject({ Bucket, Key: `${currentKey}.png` }).promise();
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
        avatarImgUrl: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}`,
      }),
    ];
  }
}
