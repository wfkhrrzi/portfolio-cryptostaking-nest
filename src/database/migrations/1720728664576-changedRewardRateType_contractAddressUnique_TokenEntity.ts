import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangedRewardRateTypeContractAddressUniqueTokenEntity1720728664576 implements MigrationInterface {
    name = 'ChangedRewardRateTypeContractAddressUniqueTokenEntity1720728664576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "UQ_3b0541a15e8aa18e596933cbc4f" UNIQUE ("contract_address")`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "reward_rate_per_second"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "reward_rate_per_second" double precision`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-11 17:57:54.640669'`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "reward_rate_per_second"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "reward_rate_per_second" integer`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "UQ_3b0541a15e8aa18e596933cbc4f"`);
    }

}
