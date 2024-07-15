import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedEncryptIvFromUserEntity1721017088403 implements MigrationInterface {
    name = 'RemovedEncryptIvFromUserEntity1721017088403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_users" DROP COLUMN "wallet_encrypt_iv"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_users" ADD "wallet_encrypt_iv" character varying(100)`);
    }

}
