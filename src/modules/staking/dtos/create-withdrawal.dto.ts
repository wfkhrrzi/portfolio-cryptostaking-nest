import { BigintFieldOptional, EnumField, UUIDField } from '@/decorators';
import { WithdrawalType } from '../enums/withdrawal-type';

export class CreateWithdrawalDto {
  @UUIDField()
  stake_id!: Uuid;

  @BigintFieldOptional()
  amount?: bigint;

  @EnumField(() => WithdrawalType)
  type!: WithdrawalType;
}
