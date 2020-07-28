import { MigrationInterface, QueryRunner } from 'typeorm';

export class sponsor1595960654212 implements MigrationInterface {
  name = 'sponsor1595960654212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "sponsor_tier_enum" AS ENUM('1', '2', '3')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sponsor" ("id" SERIAL NOT NULL, "guid" character varying NOT NULL, "name" character varying(60) NOT NULL, "banner" character varying(255) NOT NULL, "logo" character varying(255) NOT NULL, "email" character varying(70) NOT NULL, "external_link" character varying(255) NOT NULL, "tier" "sponsor_tier_enum" NOT NULL, "description" character varying(255), "in_show_room" boolean DEFAULT false, "media_url" character varying(255) NOT NULL, "url_360" character varying(255), "btn_link" character varying(255), "btn_label" character varying(30), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_33fdbe3fac3d249af8b9ad4f58d" UNIQUE ("guid"), CONSTRAINT "UQ_924f075a91e6fb72a2ac975f58f" UNIQUE ("email"), CONSTRAINT "PK_31c4354cde945c685aabe017541" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sponsor"`);
    await queryRunner.query(`DROP TYPE "sponsor_tier_enum"`);
  }
}
