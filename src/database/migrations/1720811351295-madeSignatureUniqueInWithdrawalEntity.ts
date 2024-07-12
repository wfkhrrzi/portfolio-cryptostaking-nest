import { MigrationInterface, QueryRunner } from "typeorm";

export class MadeSignatureUniqueInWithdrawalEntity1720811351295 implements MigrationInterface {
    name = 'MadeSignatureUniqueInWithdrawalEntity1720811351295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6" UNIQUE ("signature")`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-12 19:04:22.743747'`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6"`);
    }

}
