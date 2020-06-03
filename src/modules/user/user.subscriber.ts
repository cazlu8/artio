import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    const { entity } = event;
    entity.avatarImgUrl = `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}/${entity.guid}.png`;
  }
}
