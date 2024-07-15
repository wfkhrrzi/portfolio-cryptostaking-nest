import { HashField, UUIDField } from '@/decorators';
import { Hex } from 'viem';

export class CreateStakeDto {
  @HashField()
  tx_hash!: Hex;

  @UUIDField()
  token_id!: Uuid;
}
