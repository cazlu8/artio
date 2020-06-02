import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';
import { CreateAvatarDto } from '../user/dto/user.create.avatar.dto';

@Controller('avatar')
export class AvatarImageController {
  constructor(
    @InjectQueue('avatarImage') private readonly avatarQueue: Queue,
  ) {}

  @Post('create-avatar')
  async transcode(@Body() createAvatarDto: CreateAvatarDto) {
    await this.avatarQueue.add(
      'transcode',
      {
        createAvatarDto,
      },
      {
        priority: 1,
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
