import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedIsConfirmedFromStakeAndWithdrawEntity1721025885525 implements MigrationInterface {
    name = 'RemovedIsConfirmedFromStakeAndWithdrawEntity1721025885525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "is_confirmed"`);
        await queryRunner.query(`ALTER TABLE "stakes" DROP COLUMN "is_confirmed"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" ADD "is_confirmed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "is_confirmed" boolean NOT NULL DEFAULT false`);
    }

}
