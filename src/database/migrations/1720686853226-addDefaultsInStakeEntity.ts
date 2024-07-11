import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultsInStakeEntity1720686853226 implements MigrationInterface {
    name = 'AddDefaultsInStakeEntity1720686853226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "total_reward" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "claimed_reward" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-11 06:15:51.272224'`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "claimed_reward" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "total_reward" DROP DEFAULT`);
    }

}
