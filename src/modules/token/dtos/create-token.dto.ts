import { NumberField, WalletAddressField } from '@/decorators';
import { Address } from 'viem';

export class CreateTokenDto {
  @WalletAddressField()
  contract_address!: Address;

  @NumberField({ isPositive: true })
  stake_APR!: number;
}
