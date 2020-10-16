import { MigrationInterface, QueryRunner } from 'typeorm';

export class createSponsorUsers1602877490312 implements MigrationInterface {
  name = 'createSponsorUsers1602877490312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sponsor_users" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "sponsorId" integer NOT NULL, CONSTRAINT "PK_d25f1d9fd72580c2ee7f29ddf41" PRIMARY KEY ("id", "userId", "sponsorId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_users" ADD CONSTRAINT "FK_777fe09a3ad4ceaf20dace9adc7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_users" ADD CONSTRAINT "FK_b9f6a2cf4675d08d91bdf801457" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor_users" DROP CONSTRAINT "FK_b9f6a2cf4675d08d91bdf801457"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_users" DROP CONSTRAINT "FK_777fe09a3ad4ceaf20dace9adc7"`,
    );
    await queryRunner.query(`DROP TABLE "sponsor_users"`);
  }
}
