import { Repository } from 'typeorm';
import Application from '../main.test';
import { UserEventsModule } from '../../../src/modules/userEvents/userEvents.module';
import { Event } from '../../../src/modules/event/event.entity';
import { EventModule } from '../../../src/modules/event/event.module';
import { saveEvents, saveUserEvents } from '../event/data';
import { UserModule } from '../../../src/modules/user/user.module';
import { CardWalletModule } from '../../../src/modules/cardWallet/cardWallet.module';
import { User } from '../../../src/modules/user/user.entity';
import { UserEvents } from '../../../src/modules/userEvents/userEvents.entity';
import { CardWallet } from '../../../src/modules/cardWallet/cardWallet.entity';
import { saveUsers } from '../user/data';
import { saveCardWallet } from './data';

describe('CardWallet', () => {
  let app: any;
  let repository: Repository<CardWallet>;
  let userRepository: Repository<User>;
  let userEventsRepository: Repository<UserEvents>;
  let eventRepository: Repository<Event>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application([
      EventModule,
      UserModule,
      UserEventsModule,
      CardWalletModule,
    ]);
    app = server;
    repository = moduleRef.get('CardWalletRepository');
    eventRepository = moduleRef.get('EventRepository');
    userRepository = moduleRef.get('UserRepository');
    userEventsRepository = moduleRef.get('UserEventsRepository');
  });

  it(`/GET /:userId`, async done => {
    await userRepository.insert(saveUsers(4));
    await eventRepository.save(saveEvents(4));
    await userEventsRepository.save(saveUserEvents(4));
    await repository.save(saveCardWallet(1, { requestedUserId: 2 }));
    await repository.save(
      saveCardWallet(1, { requestingUserId: 1, requestedUserId: 3 }),
    );
    await repository.save(
      saveCardWallet(1, { requestingUserId: 1, requestedUserId: 4 }),
    );
    const { body: cardWallets } = await app
      .get('/cardwallet/1')
      .set('Accept', 'application/json')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200);
    expect(cardWallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
        expect.objectContaining({
          id: 4,
        }),
      ]),
    );
    done();
  });
  it(`/GET events/:userId`, async done => {
    await userRepository.insert(saveUsers(5));
    await eventRepository.save(saveEvents(5));
    await userEventsRepository.save(saveUserEvents(5));
    await repository.save(saveCardWallet(1, { requestedUserId: 2 }));
    await repository.save(
      saveCardWallet(1, { requestingUserId: 1, requestedUserId: 3 }),
    );
    await repository.save(
      saveCardWallet(1, { requestingUserId: 1, requestedUserId: 4 }),
    );
    await repository.save(
      saveCardWallet(1, { requestingUserId: 1, requestedUserId: 5 }),
    );
    const { body: events } = await app
      .get('/cardwallet/events/1')
      .set('Accept', 'application/json')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
        expect.objectContaining({
          id: 4,
        }),
      ]),
    );
    done();
  });

  afterEach(async () => {
    await repository.query(
      `truncate table "card_wallet" restart identity cascade;`,
    );
    await repository.query(`truncate table "user" restart identity cascade;`);
    await repository.query(`truncate table "event" restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
