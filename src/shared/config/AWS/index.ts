import { registerAs } from '@nestjs/config';
import * as AWS from 'aws-sdk';

const s3Config = registerAs('s3', () =>
  process.env.NODE_ENV === 'production'
    ? {
        region: process.env.S3_AWS_REGION,
      }
    : {
        s3ForcePathStyle: true,
        endpoint: new AWS.Endpoint(process.env.LOCALSTACK_URL),
      },
);

const cognitoConfig = registerAs('cognito', () => ({
  region: process.env.COGNITO_REGION,
}));

const sesConfig = registerAs('ses', () =>
  process.env.NODE_ENV === 'production'
    ? {
        region: process.env.SES_REGION,
      }
    : { endpoint: new AWS.Endpoint(process.env.LOCALSTACK_URL) },
);

const dynamoConfig = registerAs('dynamo', () => ({
  region: process.env.DYNAMODB_REGION,
}));

export { s3Config, cognitoConfig, sesConfig, dynamoConfig };
