import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { InternalServerErrorException } from '@nestjs/common';
import { s3Config } from '../../shared/config/AWS';
import { handleBase64 } from '../../shared/utils/image.utils';

@Processor('avatarImage')
export class AvatarImageProcessor {
  @Process('transcode')
  async handleTranscode(job: Job) {
    const { avatarImgUrl, guid: userId } = job.data;
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
