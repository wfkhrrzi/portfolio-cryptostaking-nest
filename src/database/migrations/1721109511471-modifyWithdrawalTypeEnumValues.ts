import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyWithdrawalTypeEnumValues1721109511471 implements MigrationInterface {
    name = 'ModifyWithdrawalTypeEnumValues1721109511471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."withdrawals_type_enum" RENAME TO "withdrawals_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."withdrawals_type_enum" AS ENUM('unstake', 'claim_reward')`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "type" TYPE "public"."withdrawals_type_enum" USING "type"::"text"::"public"."withdrawals_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."withdrawals_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."withdrawals_type_enum_old" AS ENUM('0', '1')`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ALTER COLUMN "type" TYPE "public"."withdrawals_type_enum_old" USING "type"::"text"::"public"."withdrawals_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."withdrawals_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."withdrawals_type_enum_old" RENAME TO "withdrawals_type_enum"`);
    }

}
