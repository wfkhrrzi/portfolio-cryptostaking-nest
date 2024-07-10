import { WalletAddressField } from '@/decorators';
import { Address } from 'viem';

export class UserRegisterDto {
  @WalletAddressField()
  readonly wallet_address!: Address;
}
