import * as Factory from 'factory.ts';
import * as faker from 'faker';
import { CreateUserDto } from '../../../src/modules/user/dto/user.create.dto';

const createUserDtoFactory = Factory.Sync.makeFactory<CreateUserDto>({
  guid: faker.random.uuid(),
  email: faker.internet.email(),
});

export const saveUser = createUserDtoFactory.build();
