import { registerAs } from '@nestjs/config';

export default registerAs('cloudWatch', () => ({
  logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
  logStreamName: process.env.CLOUDWATCH_LOG_STREAM,
  awsAccessKeyId: process.env.CLOUDWATCH_ACCESS_KEY,
  awsSecretKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
  awsRegion: process.env.CLOUDWATCH_REGION,
  messageFormatter: ({ level, message, additionalInfo }) =>
    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(
      additionalInfo,
    )}}`,
}));
