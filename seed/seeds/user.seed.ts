import { Factory, Seeder } from 'typeorm-seeding';
import { User } from '../../src/modules/user/user.entity';

export class CreateUser implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)().createMany(100);
  }
}
