import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import * as AWS from 'aws-sdk';
import { User } from './user.entity';
import { LoggerService } from '../../shared/services/logger.service';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';

const sharp = require('sharp');

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly loggerService: LoggerService,
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
    this.loggerService.log('saving the user');
    return this.repository
      .save(createUserDto)
      .catch(err => validateEntityUserException.check(err));
  }

  async createAvatar(
    createAvatarDto: CreateAvatarDto,
  ): Promise<void | ObjectLiteral> {
    // eslint-disable-next-line global-require,import/no-extraneous-dependencies
    AWS.config.setPromisesDependency(require('bluebird'));
    AWS.config.update({
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const s3 = new AWS.S3();
    const base64Data = Buffer.from(
      createAvatarDto.avatarImgUrl.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    const sharpedImage = await sharp(base64Data)
      .resize(400, 400)
      .png();

    const userId = createAvatarDto.guid;
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${userId}.png`, // type is not required
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64', // required
      ContentType: `image/png`, // required.
    };

    try {
      await s3.upload(params).promise();
    } catch (error) {
      console.log(error);
    }
  }
}
