import { BigintField, EnumField, HashField, UUIDField } from '@/decorators';
import { ValidateIf } from 'class-validator';
import { Hex } from 'viem';
import { WithdrawalType } from '../enums/withdrawal-type';

export class CreateWithdrawalDto {
  @ValidateIf((o: CreateWithdrawalDto) => o.stake_tx_hash === undefined)
  @UUIDField()
  stake_id?: Uuid;

  @ValidateIf((o: CreateWithdrawalDto) => o.stake_id === undefined)
  @HashField()
  stake_tx_hash?: Hex;

  @BigintField()
  amount!: bigint;

  @EnumField(() => WithdrawalType)
  type!: WithdrawalType;
}
