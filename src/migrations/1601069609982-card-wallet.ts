import { MigrationInterface, QueryRunner } from 'typeorm';

export class cardWallet1600369609982 implements MigrationInterface {
  name = 'cardWallet1600369609982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "card_wallet" ("id" SERIAL NOT NULL, "requesting_user_id" integer NOT NULL, "requested_user_id" integer NOT NULL, "event_id" integer NOT NULL, CONSTRAINT "PK_0d0ef8ac58735d84318d17c6e99" PRIMARY KEY ("requesting_user_id", "requested_user_id", "event_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_wallet" ADD CONSTRAINT "FK_0b77d04c115a4e6eb6e732946c3" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_wallet" ADD CONSTRAINT "FK_f26d6a46a382516ddad1aa5a351" FOREIGN KEY ("requesting_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_wallet" ADD CONSTRAINT "FK_6b31b03f072179c893c6ca3e495" FOREIGN KEY ("requested_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "card_wallet" DROP CONSTRAINT "FK_6b31b03f072179c893c6ca3e495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_wallet" DROP CONSTRAINT "FK_f26d6a46a382516ddad1aa5a351"`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_wallet" DROP CONSTRAINT "FK_0b77d04c115a4e6eb6e732946c3"`,
    );
    await queryRunner.query(`DROP TABLE "card_wallet"`);
  }
}
