import * as Twilio from 'twilio';

const { AccessToken } = Twilio.jwt;

const clientConfig = () => {
  const apiKeySid = process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_SECRET;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  return Twilio(apiKeySid, apiKeySecret, { accountSid });
};

const twilioConfig: any = () => {
  const apiKeySid = process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_SECRET;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  return new AccessToken(accountSid, apiKeySid, apiKeySecret);
};

export { clientConfig, twilioConfig };
