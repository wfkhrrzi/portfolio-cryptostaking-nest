import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedBlockConfirmationColumns1720896644848 implements MigrationInterface {
    name = 'AddedBlockConfirmationColumns1720896644848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "is_fulfilled"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "UQ_bfd57d67bccf0537347451dc725"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "fulfilled_tx_hash"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "fulfilled_at"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "is_confirmed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "tx_hash" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "UQ_dfb2b9b6be65a100b043f0a5e01" UNIQUE ("tx_hash")`);
        await queryRunner.query(`ALTER TABLE "stakes" ADD "is_confirmed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-13 23:36:37.1158'`);
        await queryRunner.query(`ALTER TABLE "stakes" DROP COLUMN "is_confirmed"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "UQ_dfb2b9b6be65a100b043f0a5e01"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "tx_hash"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "is_confirmed"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "fulfilled_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "fulfilled_tx_hash" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "UQ_bfd57d67bccf0537347451dc725" UNIQUE ("fulfilled_tx_hash")`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "is_fulfilled" boolean NOT NULL DEFAULT false`);
    }

}
