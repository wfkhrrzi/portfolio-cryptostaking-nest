import { HashField } from '@/decorators';
import { Hex } from 'viem';

export class CreateStakeDto {
  @HashField()
  tx_hash!: Hex;
}
