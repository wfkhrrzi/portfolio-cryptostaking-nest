import { MigrationInterface, QueryRunner } from "typeorm";

export class FixedRewardUpdatedAtInStakesEntity1720979949194 implements MigrationInterface {
    name = 'FixedRewardUpdatedAtInStakesEntity1720979949194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-15 01:58:20.883546'`);
    }

}
