import { MigrationInterface, QueryRunner } from 'typeorm';

export class eventSponsors1596053186405 implements MigrationInterface {
  name = 'eventSponsors1596053186405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_sponsors" ("id" SERIAL NOT NULL, "sponsorId" integer NOT NULL, "eventId" integer NOT NULL, PRIMARY KEY ("id", "sponsorId", "eventId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sponsors" ADD CONSTRAINT "FK_2ab10e73ed36fa5926589152fac" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sponsors" ADD CONSTRAINT "FK_2eb3acb18768533b3c871b95cc3" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_sponsors" DROP CONSTRAINT "FK_2eb3acb18768533b3c871b95cc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sponsors" DROP CONSTRAINT "FK_2ab10e73ed36fa5926589152fac"`,
    );
    await queryRunner.query(`DROP TABLE "event_sponsors"`);
  }
}
