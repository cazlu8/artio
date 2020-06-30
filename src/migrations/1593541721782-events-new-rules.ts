import { MigrationInterface, QueryRunner } from 'typeorm';

export class eventsNewRules1593541721782 implements MigrationInterface {
  name = 'eventsNewRules1593541721782';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "hero_img_url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "location_latitude" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "location_longitude" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "liveUrl" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "onLive" SET DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "onLive" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "liveUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "location_longitude" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "location_latitude" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "hero_img_url" SET NOT NULL`,
    );
  }
}
