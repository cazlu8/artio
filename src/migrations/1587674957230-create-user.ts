import { MigrationInterface, QueryRunner } from 'typeorm';

export class createUser1587674957230 implements MigrationInterface {
  name = 'createUser1587674957230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "guid" character varying NOT NULL, "first_name" character varying(255), "last_name" character varying(255), "email" character varying(70) NOT NULL, "is_new" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_guid" UNIQUE ("guid"), CONSTRAINT "UQ_user_email" UNIQUE ("email"), CONSTRAINT "PK_user_id" PRIMARY KEY ("id"))`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`, undefined);
  }
}
