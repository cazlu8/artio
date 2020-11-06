import { MigrationInterface, QueryRunner } from 'typeorm';

export class createSpeaker1604515522533 implements MigrationInterface {
  name = 'createSpeakerScheduleSpeaker1604515522533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "speaker" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "bio" character varying(1200) NOT NULL, "email" character varying(70) NOT NULL, "social_urls" json DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f898b972e1f18ea4bdf32dbab54" UNIQUE ("email"), CONSTRAINT "PK_8441432fc32d602d417bf2687a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "event_stage_schedule_speaker" ("id" SERIAL NOT NULL, "speakerId" integer NOT NULL, "scheduleId" integer NOT NULL, CONSTRAINT "PK_f70b3b7d029e1542cf9081fa287" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_stage_schedule_speaker" ADD CONSTRAINT "FK_e11638ddbe2a462e80437498ce6" FOREIGN KEY ("speakerId") REFERENCES "speaker"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_stage_schedule_speaker" ADD CONSTRAINT "FK_d8175e2a4f78a6ded4692e2f347" FOREIGN KEY ("scheduleId") REFERENCES "event_stage_schedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_stage_schedule_speaker"`);
    await queryRunner.query(`DROP TABLE "speaker"`);
  }
}
