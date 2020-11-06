import { MigrationInterface, QueryRunner } from 'typeorm';

export class addColumnsSponsorUser1604688473182 implements MigrationInterface {
  name = 'addColumnsSponsorUser1604688473182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor" ADD "youtube_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor" ADD "youtube_live_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "contact_email" character varying(70) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "contact_email"`);
    await queryRunner.query(
      `ALTER TABLE "sponsor" DROP COLUMN "youtube_live_url"`,
    );
    await queryRunner.query(`ALTER TABLE "sponsor" DROP COLUMN "youtube_url"`);
  }
}
