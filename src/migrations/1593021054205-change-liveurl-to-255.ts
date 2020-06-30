import { MigrationInterface, QueryRunner } from 'typeorm';

export class changeLiveurlTo2551593021054205 implements MigrationInterface {
  name = 'changeLiveurlTo2551593021054205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "liveUrl"`);
    await queryRunner.query(
      `ALTER TABLE "event" ADD "liveUrl" character varying(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "liveUrl"`);
    await queryRunner.query(
      `ALTER TABLE "event" ADD "liveUrl" character varying(50) NOT NULL`,
    );
  }
}
