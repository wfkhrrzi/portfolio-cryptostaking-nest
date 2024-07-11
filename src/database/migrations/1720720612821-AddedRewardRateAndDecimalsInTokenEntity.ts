import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedRewardRateAndDecimalsInTokenEntity1720720612821 implements MigrationInterface {
    name = 'AddedRewardRateAndDecimalsInTokenEntity1720720612821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "decimals" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "reward_rate_per_second" integer`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-11 08:35:04.551555'`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "reward_rate_per_second"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "decimals"`);
    }

}
