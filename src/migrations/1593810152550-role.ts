import { MigrationInterface, QueryRunner } from 'typeorm';

export class role1593810152550 implements MigrationInterface {
  name = 'role1593810152550';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "role_name_enum" AS ENUM('1', '2')`);
    await queryRunner.query(
      `CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" "role_name_enum" DEFAULT '1', CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`INSERT INTO role (id, name) VALUES (1, '1')`);
    await queryRunner.query(`INSERT INTO role (id, name) VALUES (2, '2')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TYPE "role_name_enum"`);
  }
}
