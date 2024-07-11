import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveInitialPrincipal1720678515127 implements MigrationInterface {
    name = 'RemoveInitialPrincipal1720678515127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" DROP COLUMN "initial_principal"`);
        await queryRunner.query(`ALTER TABLE "stakes" DROP COLUMN "principal_updated_at"`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-10 06:57:50.275529'`);
        await queryRunner.query(`ALTER TABLE "stakes" ADD "principal_updated_at" TIMESTAMP NOT NULL DEFAULT '2024-07-10 06:57:50.275529'`);
        await queryRunner.query(`ALTER TABLE "stakes" ADD "initial_principal" bigint NOT NULL`);
    }

}
