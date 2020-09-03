// eslint-disable-next-line
import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { User } from '../../src/modules/user/user.entity';

define(User, (faker: typeof Faker) => {
  const user = new User();
  user.guid = faker.random.uuid();
  user.email = faker.internet.email();
  user.firstName = faker.name.firstName();
  return user;
});
