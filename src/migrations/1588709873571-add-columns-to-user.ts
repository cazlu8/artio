import { MigrationInterface, QueryRunner } from 'typeorm';

export class addColumnsToUser1588709873571 implements MigrationInterface {
  name = 'addColumnsToUser1588709873571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "avatar_img_url" character varying(255)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bio" character varying(2000)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number" character varying(50)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "twitter_url" character varying(255)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "instagram_url" character varying(255)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "linkedin_url" character varying(255)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "facebook_url" character varying(255)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "facebook_url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "linkedin_url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "instagram_url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "twitter_url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "phone_number"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "avatar_img_url"`,
      undefined,
    );
  }
}
