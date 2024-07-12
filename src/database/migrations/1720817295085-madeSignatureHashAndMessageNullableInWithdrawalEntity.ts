import { MigrationInterface, QueryRunner } from "typeorm";

export class MadeSignatureHashAndMessageNullableInWithdrawalEntity1720817295085 implements MigrationInterface {
    name = 'MadeSignatureHashAndMessageNullableInWithdrawalEntity1720817295085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "signature_hash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "signature_message" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-12 19:09:38.532033'`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "signature_message" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "signature_hash" SET NOT NULL`);
    }

}
