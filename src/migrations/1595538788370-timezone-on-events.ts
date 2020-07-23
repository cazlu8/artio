import { MigrationInterface, QueryRunner } from 'typeorm';

export class timezoneOnEvents1595538788370 implements MigrationInterface {
  name = 'timezoneOnEvents1595538788370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ADD "timezone" character varying(60)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "timezone"`);
  }
}
