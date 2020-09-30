import * as Factory from 'factory.ts';
import { CardWallet } from '../../../src/modules/cardWallet/cardWallet.entity';

const createCardWalletFactory = Factory.Sync.makeFactory<Partial<CardWallet>>({
  requestingUserId: Factory.each(i => i + 1),
  requestedUserId: Factory.each(i => i + 1),
  eventId: Factory.each(i => i + 1),
});

const saveCardWallet = (amount = 5, properties = {}) =>
  createCardWalletFactory.buildList(amount, properties);

export { saveCardWallet };
