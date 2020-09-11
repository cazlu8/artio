import * as Factory from 'factory.ts';
import * as faker from 'faker';
import { CreateLogoDto } from '../../../src/modules/sponsor/dto/sponsor.create.logo.dto';
import { CreateSponsorDto } from '../../../src/modules/sponsor/dto/sponsor.create.dto';
import { UpdateSponsorDto } from '../../../src/modules/sponsor/dto/sponsor.update.dto';
import { CreateBannerDto } from '../../../src/modules/sponsor/dto/sponsor.create.banner.dto';

const createSponsorDtoFactory = Factory.Sync.makeFactory<CreateSponsorDto>({
  eventId: 1,
  name: faker.name.firstName(),
  banner: faker.image.image(),
  logo: faker.image.image(),
  email: 'testeee@test.com',
  externalLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  tier: 1,
  description: faker.lorem.text().slice(0, 254),
  inShowRoom: false,
  mediaUrl: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  url360: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLabel: 'hello, click here',
});

const createSponsorerrorDtoFactory = Factory.Sync.makeFactory<any>({
  name: faker.name.firstName(),
  banner: faker.image.image(),
  logo: faker.image.image(),
  email: 'testeee@test.com',
  externalLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  tier: 1,
  description: faker.lorem.text().slice(0, 254),
  inShowRoom: false,
  mediaUrl: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  url360: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLabel: 'hello, click here',
});

const CreateLogoDtoFactory = Factory.Sync.makeFactory<CreateLogoDto>({
  id: 1,
  logo:
    'data:image/jpeg;base64,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',
});

const CreateBannerDtoFactory = Factory.Sync.makeFactory<CreateBannerDto>({
  id: 1,
  banner:
    'data:image/jpeg;base64,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',
});

const CreatelogoErrorDtoFactory = Factory.Sync.makeFactory<CreateLogoDto>({
  id: 1,
  logo: '',
});

const CreateBannerErrorDtoFactory = Factory.Sync.makeFactory<CreateBannerDto>({
  id: 1,
  banner: '',
});

const updateSponsorDtoFactory = Factory.Sync.makeFactory<UpdateSponsorDto>({
  name: faker.name.firstName(),
  banner: faker.image.image(),
  logo: faker.image.image(),
  email: 'testeee@test.com',
  externalLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  tier: 1,
  description: faker.lorem.text(),
  inShowRoom: false,
  mediaUrl: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  url360: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLink: 'https://www.linkedin.com/in/pedro-diniz-084b31126/',
  btnLabel: 'hello, click here',
});

const saveLogorUrl = faker.image.image();

const saveSponsor = createSponsorDtoFactory.build();

const saveSponsorError = createSponsorerrorDtoFactory.build();

const updateSponsor = updateSponsorDtoFactory.build();

const createLogo = CreateLogoDtoFactory.build();

const createBanner = CreateBannerDtoFactory.build();

const createLogoError = CreatelogoErrorDtoFactory.build();

const createBannerError = CreateBannerErrorDtoFactory.build();

export {
  saveLogorUrl,
  saveSponsor,
  saveSponsorError,
  updateSponsor,
  createLogo,
  createBanner,
  createLogoError,
  createBannerError,
};
