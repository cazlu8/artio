import { MigrationInterface, QueryRunner } from 'typeorm';

export class event1593810152450 implements MigrationInterface {
  name = 'event1593810152450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event" ("id" SERIAL NOT NULL, "guid" uuid NOT NULL, "name" character varying(255) NOT NULL, "hero_img_url" character varying(255), "location_name" character varying(255), "street_name" character varying(200), "street_number" character varying(6), "state_acronym" character varying(2), "state" character varying(30), "country" character varying(30), "city" character varying(50), "zip_code" character varying(12), "description" character varying(20000), "additional_info" character varying(1000), "location_latitude" double precision, "location_longitude" double precision, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "timezone" character varying(60) NOT NULL,"created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "liveUrl" character varying(255), "streamKey" character varying(255), "streamUrl" character varying(255), "onLive" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_91d3a2f87ce84b3fd3d176f8e1c" UNIQUE ("guid"), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "event_start_date_idx" ON "event" ("start_date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "event_start_date_idx"`);
    await queryRunner.query(`DROP TABLE "event"`);
  }
}
