import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export default BullModule.registerQueueAsync({
  name: 'networkRoom',
  useFactory: async (configService: ConfigService) => ({
    redis: configService.get('redis'),
    defaultJobOptions: {
      priority: 1,
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      timeout: 300000,
    },
  }),
  inject: [ConfigService],
});
