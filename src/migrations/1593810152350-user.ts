import { MigrationInterface, QueryRunner } from 'typeorm';

export class user1593810152350 implements MigrationInterface {
  name = 'user1593810152350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_gender_enum" AS ENUM('1', '2', '3')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "guid" character varying NOT NULL, "first_name" character varying(255), "last_name" character varying(255), "email" character varying(70) NOT NULL, "avatar_img_url" character varying(255), "bio" character varying(2000), "phone_number" character varying(50), "gender" "user_gender_enum", "company" character varying(255), "current_position" character varying(255), "social_urls" json, "is_new" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_61ea3ae73af64f7ce8e9fe55e10" UNIQUE ("guid"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "user_gender_enum"`);
  }
}
