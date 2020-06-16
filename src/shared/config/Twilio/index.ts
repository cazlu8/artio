import * as Twilio from 'twilio';

const { AccessToken } = Twilio.jwt;

const clientConfig = ({ apiKeySid, apiKeySecret, accountSid }) => {
  return Twilio(apiKeySid, apiKeySecret, { accountSid });
};

const twilioConfig: any = ({ apiKeySid, apiKeySecret, accountSid }) => {
  return new AccessToken(accountSid, apiKeySid, apiKeySecret);
};

const config = () => {
  const settings = {
    apiKeySid: process.env.TWILIO_API_KEY,
    apiKeySecret: process.env.TWILIO_API_SECRET,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
  };
  return {
    clientConfig: clientConfig.bind(null, settings),
    twilioConfig: twilioConfig.bind(null, settings),
  };
};

export { config };
