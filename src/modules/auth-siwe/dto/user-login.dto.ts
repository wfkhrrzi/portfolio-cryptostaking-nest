import { SignatureField, WalletAddressField } from '@/decorators';
import { Address, Hex } from 'viem';
export class UserLoginDto {
  @SignatureField()
  readonly signature!: Hex;

  @WalletAddressField()
  readonly wallet_address!: Address;
}
