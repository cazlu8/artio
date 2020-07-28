import { MigrationInterface, QueryRunner } from 'typeorm';

export class sponsorevents1595960654500 implements MigrationInterface {
  name = 'sponsorevents1595960654500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sponsor_events" ("sponsorId" integer NOT NULL, "eventId" integer NOT NULL, CONSTRAINT "PK_02f3e3b34f94b4f9e6f7f7e76a3" PRIMARY KEY ("sponsorId", "eventId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_events" ADD CONSTRAINT "FK_1a78b255ad0d793c8005a29fc2f" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_events" ADD CONSTRAINT "FK_254645e856f857452a9f4b316e0" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor_events" DROP CONSTRAINT "FK_254645e856f857452a9f4b316e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_events" DROP CONSTRAINT "FK_1a78b255ad0d793c8005a29fc2f"`,
    );
    await queryRunner.query(`DROP TABLE "sponsor_events"`);
  }
}
