import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AvatarImageProcessor } from './avatarImage.processor';
import { AvatarImageController } from './avatarImage.controller';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'avatarImage',
      useFactory: () => ({
        redis: {
          host: 'localhost',
          port: 6379,
        },
      }),
    }),
  ],
  controllers: [AvatarImageController],
  providers: [AvatarImageProcessor],
})
export class AvatarImage {}
