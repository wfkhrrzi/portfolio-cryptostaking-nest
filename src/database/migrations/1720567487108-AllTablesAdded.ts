import { MigrationInterface, QueryRunner } from "typeorm";

export class AllTablesAdded1720567487108 implements MigrationInterface {
    name = 'AllTablesAdded1720567487108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(10) NOT NULL, "symbol" character varying(10) NOT NULL, "contract_address" character varying(100) NOT NULL, "stake_apr" integer NOT NULL, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."withdrawals_type_enum" AS ENUM('0', '1')`);
        await queryRunner.query(`CREATE TABLE "withdrawals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_fulfilled" boolean NOT NULL DEFAULT false, "fulfilled_tx_hash" character varying(100) NOT NULL, "fulfilled_at" TIMESTAMP, "amount" bigint NOT NULL, "type" "public"."withdrawals_type_enum" NOT NULL, "signature" character varying(100) NOT NULL, "signature_hash" character varying(100) NOT NULL, "signature_message" character varying NOT NULL, "stake_id" uuid, CONSTRAINT "UQ_bfd57d67bccf0537347451dc725" UNIQUE ("fulfilled_tx_hash"), CONSTRAINT "PK_9871ec481baa7755f8bd8b7c7e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "wallet_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "wallet_address" character varying(100) NOT NULL, "role" "public"."wallet_users_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "PK_14a29216163e0c0f648d9cebdf9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stakes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tx_hash" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "initial_principal" bigint NOT NULL, "principal" bigint NOT NULL, "principal_updated_at" TIMESTAMP NOT NULL DEFAULT 'now()', "total_reward" bigint NOT NULL, "claimed_reward" bigint NOT NULL, "reward_updated_at" TIMESTAMP NOT NULL DEFAULT 'now()', "user_id" uuid, "token_id" uuid, CONSTRAINT "UQ_a88175bbe25faa2710dad560fec" UNIQUE ("tx_hash"), CONSTRAINT "PK_cce3c6c35cd3518f45a33ac9ac9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_1b9de72653b6d3ef81b88574863" FOREIGN KEY ("stake_id") REFERENCES "stakes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stakes" ADD CONSTRAINT "FK_c0ba671b31c1cb1c0502b9d22fa" FOREIGN KEY ("user_id") REFERENCES "wallet_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stakes" ADD CONSTRAINT "FK_9b76deec119d48dd2b4b1c21e93" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stakes" DROP CONSTRAINT "FK_9b76deec119d48dd2b4b1c21e93"`);
        await queryRunner.query(`ALTER TABLE "stakes" DROP CONSTRAINT "FK_c0ba671b31c1cb1c0502b9d22fa"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_1b9de72653b6d3ef81b88574863"`);
        await queryRunner.query(`DROP TABLE "stakes"`);
        await queryRunner.query(`DROP TABLE "wallet_users"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_users_role_enum"`);
        await queryRunner.query(`DROP TABLE "withdrawals"`);
        await queryRunner.query(`DROP TYPE "public"."withdrawals_type_enum"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
    }

}
