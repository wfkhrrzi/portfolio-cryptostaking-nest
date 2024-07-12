import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedNetworkChainEntity1720806239392 implements MigrationInterface {
    name = 'CreatedNetworkChainEntity1720806239392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "network_chains" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "chain_name" character varying(100) NOT NULL, "chain_id" integer NOT NULL, CONSTRAINT "PK_1dbe73235e180f022f92b2a4bb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "chain_id" uuid`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_146682b87089cb89412039459bc" FOREIGN KEY ("chain_id") REFERENCES "network_chains"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_146682b87089cb89412039459bc"`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-12 17:43:42.905261'`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "chain_id"`);
        await queryRunner.query(`DROP TABLE "network_chains"`);
    }

}
