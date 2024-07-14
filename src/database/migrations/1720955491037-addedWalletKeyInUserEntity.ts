import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedWalletKeyInUserEntity1720955491037 implements MigrationInterface {
    name = 'AddedWalletKeyInUserEntity1720955491037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "signer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "wallet_users" ADD "wallet_key" character varying`);
        await queryRunner.query(`ALTER TABLE "wallet_users" ADD "wallet_encrypt_iv" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_50293670c447bb20ca2b2e08455" FOREIGN KEY ("signer_id") REFERENCES "wallet_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_50293670c447bb20ca2b2e08455"`);
        await queryRunner.query(`ALTER TABLE "stakes" ALTER COLUMN "reward_updated_at" SET DEFAULT '2024-07-14 19:11:17.9182'`);
        await queryRunner.query(`ALTER TABLE "wallet_users" DROP COLUMN "wallet_encrypt_iv"`);
        await queryRunner.query(`ALTER TABLE "wallet_users" DROP COLUMN "wallet_key"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "signer_id"`);
    }

}
