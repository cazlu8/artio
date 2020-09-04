import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Sponsor } from '../../src/modules/sponsor/sponsor.entity';

define(Sponsor, (faker: typeof Faker) => {
  const sponsor = new Sponsor();

  sponsor.guid = faker.random.uuid();
  sponsor.id = faker.random.number(1);
  sponsor.name = faker.company.companyName();
  sponsor.banner = faker.image.image();
  sponsor.logo = faker.image.image();
  sponsor.email = faker.internet.email();
  sponsor.externalLink = faker.internet.url();
  sponsor.tier = 1;
  sponsor.description = faker.lorem.word();
  sponsor.inShowRoom = faker.random.boolean();
  sponsor.mediaUrl = faker.internet.url();
  sponsor.url360 = faker.internet.url();
  sponsor.textUrl360 = faker.internet.url();
  sponsor.btnLink = faker.internet.url();
  sponsor.btnLabel = faker.lorem.word();

  return sponsor;
});
