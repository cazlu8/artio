import { EntityRepository, Repository } from 'typeorm';
import { Sponsor } from './sponsor.entity';

@EntityRepository(Sponsor)
export class SponsorRepository extends Repository<Sponsor> {
  async get({ where, select }) {
    return this.findOne({ select, where });
  }

  removeAvatarUrl(id: any) {
    return this.createQueryBuilder()
      .update(Sponsor)
      .set({ logo: null })
      .where(`id = ${id}`)
      .execute();
  }
}
