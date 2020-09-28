import { MigrationInterface, QueryRunner } from 'typeorm';

export class createEventStage1601070210517 implements MigrationInterface {
  name = 'createEventStage1601070210517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_stages" ("id" SERIAL NOT NULL, "name" character varying(255), "region" character varying(12), "media_live_channel_id" integer NOT NULL, "media_live_input_id" integer NOT NULL, "cdn_distribution_id" character varying(15), "live_url" character varying(255), "stream_key" character varying(255), "stream_url" character varying(255), "on_live" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, CONSTRAINT "REL_51d605e87092fbea14e82d002c" UNIQUE ("eventId"), CONSTRAINT "PK_fb7ed931d2577871c6f0f010cf8" PRIMARY KEY ("id", "eventId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_stages" ADD CONSTRAINT "FK_51d605e87092fbea14e82d002c8" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_stages"`);
  }
}
