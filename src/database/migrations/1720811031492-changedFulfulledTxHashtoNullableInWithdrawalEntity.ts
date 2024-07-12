import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangedFulfulledTxHashtoNullableInWithdrawalEntity1720811031492 implements MigrationInterface {
    name = 'ChangedFulfulledTxHashtoNullableInWithdrawalEntity1720811031492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "fulfilled_tx_hash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-12 17:45:02.379639'`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "fulfilled_tx_hash" SET NOT NULL`);
    }

}
