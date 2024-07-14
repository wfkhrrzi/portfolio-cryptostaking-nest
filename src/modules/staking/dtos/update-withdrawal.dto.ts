import { HashField } from '@/decorators';
import { Hex } from 'viem';

export class UpdateWithdrawalDto {
  @HashField()
  tx_hash!: Hex;
}
