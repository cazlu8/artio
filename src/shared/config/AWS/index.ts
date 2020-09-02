import { registerAs } from '@nestjs/config';
import * as AWS from 'aws-sdk';

const s3Config = registerAs('s3', () =>
  process.env.NODE_ENV === 'production'
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_AWS_REGION,
      }
    : {
        s3ForcePathStyle: true,
        endpoint: new AWS.Endpoint(process.env.LOCALSTACK_URL),
      },
);

const cognitoConfig = registerAs('cognito', () => ({
  accessKeyId: process.env.COGNITO_ACCESS_KEY,
  secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
  region: process.env.COGNITO_REGION,
  apiVersion: '2016-04-18',
}));

const sesConfig = registerAs('ses', () =>
  process.env.NODE_ENV === 'production'
    ? {
        accessKeyId: process.env.SES_ACCESS_KEY,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
        region: process.env.SES_REGION,
      }
    : { endpoint: new AWS.Endpoint(process.env.LOCALSTACK_URL) },
);

export { s3Config, cognitoConfig, sesConfig };
