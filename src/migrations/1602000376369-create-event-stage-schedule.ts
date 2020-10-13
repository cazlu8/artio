import { MigrationInterface, QueryRunner } from 'typeorm';

export class createEventStageSchedule1602000376369
  implements MigrationInterface {
  name = 'createEventStageSchedule1602000376369';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_stage_schedule" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "start_date" TIMESTAMP NOT NULL DEFAULT now(), "end_date" TIMESTAMP NOT NULL DEFAULT now(), "eventStageId" integer NOT NULL, CONSTRAINT "PK_69c59bb672834be0f1c3f564943" PRIMARY KEY ("id", "eventStageId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_stage_schedule" ADD CONSTRAINT "FK_96b62656ef8880b830b79d4a00f" FOREIGN KEY ("eventStageId") REFERENCES "event_stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_stage_schedule" DROP CONSTRAINT "FK_96b62656ef8880b830b79d4a00f"`,
    );
    await queryRunner.query(`DROP TABLE "event_stage_schedule"`);
  }
}
