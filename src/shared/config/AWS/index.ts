import * as AWS from "aws-sdk";
import * as bluebird from 'bluebird';

AWS.config.setPromisesDependency(bluebird);
AWS.config.update({
                    accessKeyId: process.env.ACCESS_KEY_ID,
                    secretAccessKey: process.env.SECRET_ACCESS_KEY,
                    region: process.env.AWS_REGION,
                  });
const S3 = () => new AWS.S3 ();
export { S3 };
