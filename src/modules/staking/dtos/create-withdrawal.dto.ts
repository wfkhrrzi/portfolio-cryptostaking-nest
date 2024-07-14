import { BigintField, EnumField, UUIDField } from '@/decorators';
import { WithdrawalType } from '../enums/withdrawal-type';

export class CreateWithdrawalDto {
  @UUIDField()
  stake_id!: Uuid;

  @BigintField()
  amount!: bigint;

  @EnumField(() => WithdrawalType)
  type!: WithdrawalType;
}
