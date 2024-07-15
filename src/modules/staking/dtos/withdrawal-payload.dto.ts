import { ClassField } from '@/decorators';
import { WithdrawalDto } from './withdrawal.dto';

export class WithdrawalPayloadDto {
  @ClassField(() => WithdrawalDto)
  withdrawal: WithdrawalDto;

  constructor(withdrawal: WithdrawalDto) {
    this.withdrawal = withdrawal;
  }
}
