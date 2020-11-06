import { registerAs } from '@nestjs/config';

const vonageConfig = registerAs('vonage', () => [
  process.env.VONAGE_API_KEY,
  process.env.VONAGE_API_SECRET,
]);

export default vonageConfig;
