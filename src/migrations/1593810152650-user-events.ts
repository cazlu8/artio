import { MigrationInterface, QueryRunner } from 'typeorm';

export class userevents1593810152650 implements MigrationInterface {
  name = 'userevents1593810152650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_events" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "eventId" integer NOT NULL,"ticketCode" character varying(255), "redeemed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e16aa6bf768bd6b1439cec5c718" PRIMARY KEY ("id", "userId", "eventId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_events" ADD CONSTRAINT "FK_cdc20a262881171de056ae2e5aa" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_events" ADD CONSTRAINT "FK_63cb9d79f7be87efc6efc72a6ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_events" DROP CONSTRAINT "FK_63cb9d79f7be87efc6efc72a6ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_events" DROP CONSTRAINT "FK_cdc20a262881171de056ae2e5aa"`,
    );
    await queryRunner.query(`DROP TABLE "user_events"`);
  }
}
