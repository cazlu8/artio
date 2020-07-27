import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

export default BullModule.registerQueueAsync({
  name: 'event',
  useFactory: async (configService: ConfigService) => ({
    redis: configService.get('redis'),
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  }),
  inject: [ConfigService],
});
