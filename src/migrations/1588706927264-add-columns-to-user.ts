import { MigrationInterface, QueryRunner } from 'typeorm';

export class addColumnsToUser1588706927264 implements MigrationInterface {
  name = 'addColumnsToUser1588706927264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bio" character varying(2000)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "phone_number"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number" character varying(50)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "phone_number"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number" integer`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bio" character varying(10000)`,
      undefined,
    );
  }
}
