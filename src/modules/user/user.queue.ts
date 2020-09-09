import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export default BullModule.registerQueueAsync({
  name: 'user',
  useFactory: async (configService: ConfigService) => ({
    redis: configService.get('redis')[0],
    defaultJobOptions: {
      priority: 1,
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      timeout: 100000,
    },
  }),
  inject: [ConfigService],
});
