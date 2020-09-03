import { Factory, Seeder } from 'typeorm-seeding';
import { Event } from '../../src/modules/event/event.entity';

export class CreateEvent implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(Event)().create();
  }
}
