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
    const { avatarImgUrl, id: userId } = createAvatarDto;

    const base64Data = Buffer.from(handleBase64(avatarImgUrl), 'base64');

    // await this.exists({ avatarImgUrl: Not(null) });

    const sharpedImage = await sharp(base64Data)
      .resize(400, 400)
      .png();

    const avatarId = uuid();

    const params = {
      Bucket: process.env.S3_BUCKET_AVATAR,
      Key: `${avatarId}.png`,
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64',
      ContentType: `image/png`,
    };

    try {
      const s3 = new AWS.S3(s3Config());
      await s3.upload(params).promise();
      await this.repository.update(userId, {
        avatarImgUrl: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}`,
      });
      return { url: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
