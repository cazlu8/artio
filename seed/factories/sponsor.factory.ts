import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Sponsor } from '../../src/modules/sponsor/sponsor.entity';

define(Sponsor, (faker: typeof Faker) => {
  const sponsor = new Sponsor();
  sponsor.id = faker.random.number(1);
  sponsor.tier = 1;
  sponsor.name = faker.company.companyName();
  sponsor.guid = faker.random.uuid();
  sponsor.banner = faker.random.image();
  sponsor.email = faker.internet.email();
  sponsor.externalLink = faker.internet.url();
  return sponsor;
});
