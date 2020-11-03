import { MigrationInterface, QueryRunner } from 'typeorm';

export class createCategoryInterests1604434695469
  implements MigrationInterface {
  name = 'createCategoryInterests1604434695469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category_interests" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "PK_f1050f0555bb791229fc85f7f55" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "interests" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "categoryId" integer NOT NULL, CONSTRAINT "PK_a2dc7b6f9a8bcf9e3f9312a879d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "interests" ADD CONSTRAINT "FK_f5f5746cd385a64ae7496faf204" FOREIGN KEY ("categoryId") REFERENCES "category_interests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_category_interests" ("id" SERIAL NOT NULL, "categoryId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_86deff797cb37ff3625f7a19be5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_category_interests" ADD CONSTRAINT "FK_493d47cdb315ea1f3be46934202" FOREIGN KEY ("categoryId") REFERENCES "category_interests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_category_interests" ADD CONSTRAINT "FK_7df48242a69f792ad049d9a620a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Arts")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Science")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Culture and Community")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Design and Innovation")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Diversity")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Education")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Bussiner and Carrer")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Politics and Activism")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Recreation and Pastimes")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Entertainment")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Sports")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Family and Lifestyle")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Games")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Language")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Marketing")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Pets")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Health")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Religion")`,
    );
    await queryRunner.query(
      `INSERT INTO category_interests  ("name") values ("Technology")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_category_interests"`);
    await queryRunner.query(`DROP TABLE "interests"`);
    await queryRunner.query(`DROP TABLE "category_interests"`);
  }
}
