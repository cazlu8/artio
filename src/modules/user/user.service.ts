import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { s3Config } from '../../shared/config/AWS';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { handleBase64 } from '../../shared/utils/image.utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findOne(guid: string): Promise<User | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound')
        throw new UnprocessableEntityException();
      throw new InternalServerErrorException(error);
    });
  }

  update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return this.repository.update(id, updateUserDto);
  }

  getUserGuid(id) {
    return this.repository.findOne({ select: ['guid'], where: { id } });
  }

  exists(key: string, value: any): Promise<number> {
    return this.repository.count({ [key]: value });
  }

  create(createUserDto: CreateUserDto): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createUserDto)
      .catch(err => validateEntityUserException.check(err));
  }

  async createAvatar(
    createAvatarDto: CreateAvatarDto,
  ): Promise<void | ObjectLiteral> {
    const { avatarImgUrl, guid: userId } = createAvatarDto;
    const base64Data = Buffer.from(handleBase64(avatarImgUrl), 'base64');

    const sharpedImage = await sharp(base64Data)
      .resize(400, 400)
      .png();

    const params = {
      Bucket: process.env.S3_BUCKET_AVATAR,
      Key: `${userId}.png`,
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64',
      ContentType: `image/png`,
    };

    try {
      const s3 = new AWS.S3(s3Config());
      await s3.upload(params).promise();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
