import { MigrationInterface, QueryRunner } from 'typeorm';

export class createEventStage1601067156304 implements MigrationInterface {
  name = 'createEventStage1601067156304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_stages" ("id" SERIAL NOT NULL, "name" character varying(255), "eventId" integer NOT NULL, "liveUrl" character varying(255), "streamKey" character varying(255), "streamUrl" character varying(255), "onLive" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_51d605e87092fbea14e82d002c" UNIQUE ("eventId"), CONSTRAINT "PK_fb7ed931d2577871c6f0f010cf8" PRIMARY KEY ("id", "eventId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_stages" ADD CONSTRAINT "FK_51d605e87092fbea14e82d002c8" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_stages"`);
  }
}
