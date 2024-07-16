import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifySignatureVarcharLengthInWithdrawalEntity1721110055335 implements MigrationInterface {
    name = 'ModifySignatureVarcharLengthInWithdrawalEntity1721110055335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "signature"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "signature" character varying(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6" UNIQUE ("signature")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP COLUMN "signature"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD "signature" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "UQ_3d9c45f41481b4ba1a9762346f6" UNIQUE ("signature")`);
    }

}
