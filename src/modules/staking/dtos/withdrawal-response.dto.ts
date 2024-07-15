import { EnumFieldOptional } from '@/decorators';
import { Transform } from 'class-transformer';
import { WithdrawalEntity } from '../entities/withdrawal.entity';
import { WithdrawalType } from '../enums/withdrawal-type';
import { WithdrawalDto } from './withdrawal.dto';

type WithdrawalTypeResponse = {
  value: number;
  ops: string;
};

export class WithdrawalResponseDto extends WithdrawalDto {
  @EnumFieldOptional(() => WithdrawalType)
  @Transform(({ value }) =>
    value == WithdrawalType.UNSTAKE
      ? ({ ops: 'unstake', value } as WithdrawalTypeResponse)
      : ({ ops: 'claim reward', value } as WithdrawalTypeResponse),
  )
  type: WithdrawalType;

  constructor(withdrawal: WithdrawalEntity) {
    super(withdrawal);

    this.type = withdrawal.type;
  }
}
