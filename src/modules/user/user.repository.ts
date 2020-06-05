import { EntityRepository, Repository } from 'typeorm';
import * as AWS from 'aws-sdk';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from './user.entity';
import { s3Config } from '../../shared/config/AWS';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async exists(properties: {}): Promise<boolean> {
    return (await this.count(properties)) > 0;
  }

  async get({ where, select }) {
    return this.findOne({ select, where });
  }

  async deleteAvatar(user: User, Bucket: string): Promise<void> {
    const s3 = new AWS.S3(s3Config());
    if (user?.avatarImgUrl) {
      try {
        const { avatarImgUrl: formerUrl } = user;
        const lastIndex = formerUrl.lastIndexOf('/');
        const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
        await s3.deleteObject({ Bucket, Key: `${currentKey}.png` }).promise();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    }
  }
}
