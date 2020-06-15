const s3Config = () => ({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const cognitoConfig = () => ({
  accessKeyId: process.env.COGNITO_ACCESS_KEY,
  secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
  region: 'us-west-2',
  apiVersion: '2016-04-18',
});

export { s3Config, cognitoConfig };
