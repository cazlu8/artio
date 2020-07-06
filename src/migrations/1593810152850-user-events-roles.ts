import {MigrationInterface, QueryRunner} from "typeorm";

export class usereventsroles1593810152850 implements MigrationInterface {
    name = 'usereventsroles1593810152850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_events_roles" ("userEventsId" integer NOT NULL, "roleId" integer NOT NULL, "userEventsUserId" integer, "userEventsEventId" integer, CONSTRAINT "PK_565086969e12db53dba478b7897" PRIMARY KEY ("userEventsId", "roleId"))`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" ADD CONSTRAINT "FK_adaf3789688c917cf7ab2089580" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" ADD CONSTRAINT "FK_da0c026865e245b1511a0e87710" FOREIGN KEY ("userEventsId", "userEventsUserId", "userEventsEventId") REFERENCES "user_events"("id","userId","eventId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_events_roles" DROP CONSTRAINT "FK_da0c026865e245b1511a0e87710"`);
        await queryRunner.query(`ALTER TABLE "user_events_roles" DROP CONSTRAINT "FK_adaf3789688c917cf7ab2089580"`);
        await queryRunner.query(`DROP TABLE "user_events_roles"`);
    }

}
