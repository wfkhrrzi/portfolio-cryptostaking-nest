import { AbstractDto } from '@/common/dto/abstract.dto';
import {
  BooleanField,
  DateFieldOptional,
  EnumField,
  StringField,
} from '@/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Hex } from 'viem';
import { WithdrawalEntity } from '../entities/withdrawal.entity';
import { WithdrawalType } from '../enums/withdrawal-type';

export class WithdrawalDto extends AbstractDto {
  @BooleanField()
  is_fulfilled: boolean;

  @StringField({ minLength: 66, maxLength: 66 })
  fulfilled_tx_hash: Hex;

  @DateFieldOptional()
  fulfilled_at: Date | null;

  @ApiProperty()
  amount: bigint;

  @EnumField(() => WithdrawalType)
  type: WithdrawalType;

  @StringField({ minLength: 132, maxLength: 132 })
  signature: Hex;

  @StringField({ minLength: 66, maxLength: 66 })
  signature_hash: Hex;

  @StringField()
  signature_message: string;

  constructor(withdrawal: WithdrawalEntity) {
    super(withdrawal);

    this.is_fulfilled = withdrawal.is_fulfilled;
    this.fulfilled_tx_hash = withdrawal.fulfilled_tx_hash;
    this.fulfilled_at = withdrawal.fulfilled_at;
    this.amount = withdrawal.amount;
    this.type = withdrawal.type;
    this.signature = withdrawal.signature;
    this.signature_hash = withdrawal.signature_hash;
    this.signature_message = withdrawal.signature_message;
  }
}
