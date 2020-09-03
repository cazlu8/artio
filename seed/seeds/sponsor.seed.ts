import { Factory, Seeder } from 'typeorm-seeding';
import { Sponsor } from '../../src/modules/sponsor/sponsor.entity';

export class CreateSponsor implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(Sponsor)().create();
  }
}
