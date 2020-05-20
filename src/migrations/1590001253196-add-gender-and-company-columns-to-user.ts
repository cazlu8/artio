import { MigrationInterface, QueryRunner } from 'typeorm';

export class addGenderAndCompanyColumnsToUser1590001253196
  implements MigrationInterface {
  name = 'addGenderAndCompanyColumnsToUser1590001253196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_gender_enum" AS ENUM('1', '2', '3')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "gender" "user_gender_enum"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "company" character varying(255)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "current_position" character varying(255)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "current_position"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "company"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "gender"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "user_gender_enum"`, undefined);
  }
}
