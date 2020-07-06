import {MigrationInterface, QueryRunner} from "typeorm";

export class artioDevInitialStructure1593810152340 implements MigrationInterface {
    name = 'artioDevInitialStructure1593810152340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event" ("id" SERIAL NOT NULL, "guid" uuid NOT NULL, "name" character varying(255) NOT NULL, "hero_img_url" character varying(255), "location_name" character varying(255) NOT NULL, "street_name" character varying(200) NOT NULL, "street_number" character varying(6) NOT NULL, "state_acronym" character varying(2) NOT NULL, "state" character varying(30) NOT NULL, "country" character varying(30) NOT NULL, "city" character varying(50) NOT NULL, "zip_code" character varying(12) NOT NULL, "description" character varying(20000), "additional_info" character varying(1000), "location_latitude" double precision, "location_longitude" double precision, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "liveUrl" character varying(255), "onLive" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_91d3a2f87ce84b3fd3d176f8e1c" UNIQUE ("guid"), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "event_start_date_idx" ON "event" ("start_date") `);
        await queryRunner.query(`CREATE TYPE "user_gender_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "guid" character varying NOT NULL, "first_name" character varying(255), "last_name" character varying(255), "email" character varying(70) NOT NULL, "avatar_img_url" character varying(255), "bio" character varying(2000), "phone_number" character varying(50), "gender" "user_gender_enum", "company" character varying(255), "current_position" character varying(255), "social_urls" json, "is_new" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_61ea3ae73af64f7ce8e9fe55e10" UNIQUE ("guid"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_events" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "eventId" integer NOT NULL, CONSTRAINT "PK_e16aa6bf768bd6b1439cec5c718" PRIMARY KEY ("id", "userId", "eventId"))`);
        await queryRunner.query(`CREATE TYPE "role_name_enum" AS ENUM('1', '2')`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" "role_name_enum" DEFAULT '1', CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_events_roles" ("userEventsId" integer NOT NULL, "roleId" integer NOT NULL, "userEventsUserId" integer, "userEventsEventId" integer, CONSTRAINT "PK_565086969e12db53dba478b7897" PRIMARY KEY ("userEventsId", "roleId"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`ALTER TABLE "user_events" ADD CONSTRAINT "FK_cdc20a262881171de056ae2e5aa" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events" ADD CONSTRAINT "FK_63cb9d79f7be87efc6efc72a6ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" ADD CONSTRAINT "FK_adaf3789688c917cf7ab2089580" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" ADD CONSTRAINT "FK_da0c026865e245b1511a0e87710" FOREIGN KEY ("userEventsId", "userEventsUserId", "userEventsEventId") REFERENCES "user_events"("id","userId","eventId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" DROP CONSTRAINT "FK_da0c026865e245b1511a0e87710"`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" DROP CONSTRAINT "FK_adaf3789688c917cf7ab2089580"`);
        await queryRunner.query(`ALTER TABLE "user_events" DROP CONSTRAINT "FK_63cb9d79f7be87efc6efc72a6ad"`);
        await queryRunner.query(`ALTER TABLE "user_events" DROP CONSTRAINT "FK_cdc20a262881171de056ae2e5aa"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "user_events_roles"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TYPE "role_name_enum"`);
        await queryRunner.query(`DROP TABLE "user_events"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "user_gender_enum"`);
        await queryRunner.query(`DROP INDEX "event_start_date_idx"`);
        await queryRunner.query(`DROP TABLE "event"`);
    }

}
