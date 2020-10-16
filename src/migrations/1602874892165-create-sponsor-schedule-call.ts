import { MigrationInterface, QueryRunner } from 'typeorm';

export class createSponsorScheduleCall1602874892165
  implements MigrationInterface {
  name = 'createSponsorScheduleCall1602874892165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sponsor_schedule_call" ("id" SERIAL NOT NULL, "reserved" boolean NOT NULL DEFAULT false, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "sponsorId" integer NOT NULL, CONSTRAINT "PK_01a882ef80f279dd7bcfa1ca838" PRIMARY KEY ("id", "sponsorId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor_schedule_call" ADD CONSTRAINT "FK_ffd25a6be338b60383d19afa06a" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor_schedule_call" DROP CONSTRAINT "FK_ffd25a6be338b60383d19afa06a"`,
    );
    await queryRunner.query(`DROP TABLE "sponsor_schedule_call"`);
  }
}
