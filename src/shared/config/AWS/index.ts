import { registerAs } from '@nestjs/config';

const s3Config = registerAs('s3', () => ({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_AWS_REGION,
}));

const cognitoConfig = registerAs('cognito', () => ({
  accessKeyId: process.env.COGNITO_ACCESS_KEY,
  secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
  region: process.env.COGNITO_REGION,
  apiVersion: '2016-04-18',
}));

const sesConfig = registerAs('ses', () => ({
  accessKeyId: process.env.SES_ACCESS_KEY,
  secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
  region: process.env.SES_REGION,
}));

export { s3Config, cognitoConfig, sesConfig };
