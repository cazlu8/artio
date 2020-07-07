import { MigrationInterface, QueryRunner } from 'typeorm';

export class addingStreamFieldsOnEvent1594152478384
  implements MigrationInterface {
  name = 'addingStreamFieldsOnEvent1594152478384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ADD "streamKey" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "streamUrl" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "streamUrl"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "streamKey"`);
  }
}
