import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import S3 from 'aws-sdk/clients/s3';
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';

@Injectable()
export class UploadService {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3(this.configService.get('s3'));
  }

  async uploadObject(
    params: S3.Types.PutObjectRequest,
    options?: ManagedUpload.ManagedUploadOptions,
  ) {
    return this.s3.upload(params, options).promise();
  }

  deleteObject(params: S3.Types.DeleteObjectRequest) {
    return this.s3.deleteObject(params).promise();
  }
}
