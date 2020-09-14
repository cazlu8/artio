import { MigrationInterface, QueryRunner } from 'typeorm';

export class AndPhoneToSponsor1600092049998 implements MigrationInterface {
  name = 'addingAdrres-AndPhoneToSponsor1600092049998';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor" ALTER COLUMN "external_link" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor" ADD "phone_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sponsor" ADD "address" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sponsor" ALTER COLUMN "external_link" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "sponsor" DROP COLUMN "phone_number"`);
    await queryRunner.query(
      `ALTER TABLE "role_user_events_user_events" DROP CONSTRAINT "FK_72fd98302e572343a598183b119"`,
    );
    await queryRunner.query(`ALTER TABLE "sponsor" DROP COLUMN "address"`);
  }
}
