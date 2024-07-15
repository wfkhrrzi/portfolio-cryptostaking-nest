import { AbstractDto } from '@/common/dto/abstract.dto';
import {
  BigintFieldOptional,
  BooleanFieldOptional,
  EnumFieldOptional,
  HashFieldOptional,
  SignatureFieldOptional,
  StringFieldOptional,
} from '@/decorators';
import { Exclude, Transform } from 'class-transformer';
import { Hex } from 'viem';
import { WithdrawalEntity } from '../entities/withdrawal.entity';
import { WithdrawalType } from '../enums/withdrawal-type';

type WithdrawalTypeResponse = {
  value: number;
  ops: string;
};

export class WithdrawalDto extends AbstractDto {
  @BooleanFieldOptional()
  is_confirmed: boolean;

  @HashFieldOptional()
  tx_hash: Hex;

  @BigintFieldOptional()
  amount: bigint;

  @EnumFieldOptional(() => WithdrawalType)
  @Transform(({ value }) =>
    value == WithdrawalType.UNSTAKE
      ? ({ ops: 'unstake', value } as WithdrawalTypeResponse)
      : ({ ops: 'claim reward', value } as WithdrawalTypeResponse),
  )
  type: WithdrawalType;

  @SignatureFieldOptional()
  signature: Hex;

  @HashFieldOptional({ minLength: 66, maxLength: 66 })
  @Exclude()
  signature_hash: Hex;

  @StringFieldOptional()
  @Exclude()
  signature_message: string;

  constructor(withdrawal: WithdrawalEntity) {
    super(withdrawal);

    this.is_confirmed = withdrawal.is_confirmed;
    this.tx_hash = withdrawal.tx_hash;
    this.amount = withdrawal.amount;
    this.type = withdrawal.type;
    this.signature = withdrawal.signature;
    this.signature_hash = withdrawal.signature_hash;
    this.signature_message = withdrawal.signature_message;
  }
}
