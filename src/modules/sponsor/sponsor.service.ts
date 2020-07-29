import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ObjectLiteral, UpdateResult } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import { Sponsor } from './sponsor.entity';
import { CreateSponsorDto } from './dto/sponsor.create.dto';
import { UpdateSponsorDto } from './dto/sponsor.update.dto';
import { s3Config } from '../../shared/config/AWS';
import { CreateLogoDto } from './dto/sponsor.create.logo.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { SponsorRepository } from './sponsor.repository';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';

@Injectable()
export class SponsorService {
  constructor(private readonly repository: SponsorRepository) {}

  findOne(guid: string): Promise<Partial<Sponsor> | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  updateUserInfo(
    id: number,
    updateSponsorDto: UpdateSponsorDto,
  ): Promise<UpdateResult> {
    return this.update(id, updateSponsorDto);
  }

  create(createSponsorDto: CreateSponsorDto): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createSponsorDto)
      .catch(err => validateEntityUserException.check(err));
  }

  async createAvatar(
    createLogoDto: CreateLogoDto,
  ): Promise<void | ObjectLiteral> {
    try {
      const { logo, id: userId } = createLogoDto;
      const avatarId: string = uuid();
      const { user, sharpedImage } = await this.processAvatarImage(
        logo,
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
      select: ['logo'],
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
        logo: `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}${avatarId}.png`,
      }),
    ];
  }

  getAvatarUrl(id): Promise<Partial<Sponsor> | void> {
    return this.repository.findOne({
      select: ['logo'],
      where: { id },
    });
  }

  getUserByEmail(email): Promise<Sponsor | void> {
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
    const user: any = await this.repository.get({
      select: ['avatarImgUrl'],
      where: { id },
    });
    await this.repository.removeAvatarUrl(id);
    const s3 = new AWS.S3(s3Config());
    const Bucket = process.env.S3_BUCKET_AVATAR;
    await this.deleteAvatar(user, s3, Bucket);
  }

  private update(
    id: number,
    userData: Partial<Sponsor>,
  ): Promise<UpdateResult> {
    return this.repository.update(id, userData);
  }
}
