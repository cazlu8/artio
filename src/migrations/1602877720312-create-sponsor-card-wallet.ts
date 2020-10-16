import { MigrationInterface, QueryRunner } from 'typeorm';

export class createSponsorCardWallet1602877720312
  implements MigrationInterface {
  name = 'createSponsorCardWallet1602877720312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sponsor_card_wallet" ("id" SERIAL NOT NULL, "sponsorId" integer NOT NULL, "userId" integer NOT NULL, "eventId" integer NOT NULL, CONSTRAINT "PK_c7d64d8537b50b4bbc58994cb70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" ADD CONSTRAINT "FK_91390b75c7146a17b5ee42444a9" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" ADD CONSTRAINT "FK_3f1e45f43eb273ddc73097eb26a" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" ADD CONSTRAINT "FK_82121f7d4b03e8e96e904f861ef" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" DROP CONSTRAINT "FK_82121f7d4b03e8e96e904f861ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" DROP CONSTRAINT "FK_3f1e45f43eb273ddc73097eb26a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_card_wallet" DROP CONSTRAINT "FK_91390b75c7146a17b5ee42444a9"`,
    );
    await queryRunner.query(`DROP TABLE "sponsor_card_wallet"`);
  }
}
