import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { User } from '../../src/modules/user/user.entity';

define(User, (faker: typeof Faker) => {
  const user = new User();

  user.guid = faker.random.uuid();
  user.firstName = faker.name.firstName();
  user.lastName = faker.name.lastName();
  user.email = faker.internet.email();
  user.avatarImgUrl = faker.image.image();
  user.bio = faker.lorem.text();
  user.phoneNumber = '+5512991650936';
  user.gender = 1;
  user.company = faker.company.companyName();
  user.currentPosition = faker.name.jobTitle();
  user.socialUrls = '{ urls: [] }';
  user.isNew = true;

  return user;
});
