import { AbstractDto } from '@/common/dto/abstract.dto';
import {
  BigintField,
  BooleanField,
  EnumField,
  SignatureField,
  StringField,
} from '@/decorators';
import { Hex } from 'viem';
import { WithdrawalEntity } from '../entities/withdrawal.entity';
import { WithdrawalType } from '../enums/withdrawal-type';

export class WithdrawalDto extends AbstractDto {
  @BooleanField()
  is_fulfilled: boolean;

  @StringField({ minLength: 66, maxLength: 66 })
  fulfilled_tx_hash: Hex;

  @BigintField()
  amount: bigint;

  @EnumField(() => WithdrawalType)
  type: WithdrawalType;

  @SignatureField()
  signature: Hex;

  @StringField({ minLength: 66, maxLength: 66 })
  signature_hash: Hex;

  @StringField()
  signature_message: string;

  constructor(withdrawal: WithdrawalEntity) {
    super(withdrawal);

    this.is_fulfilled = withdrawal.is_confirmed;
    this.fulfilled_tx_hash = withdrawal.tx_hash;
    this.amount = withdrawal.amount;
    this.type = withdrawal.type;
    this.signature = withdrawal.signature;
    this.signature_hash = withdrawal.signature_hash;
    this.signature_message = withdrawal.signature_message;
  }
}
