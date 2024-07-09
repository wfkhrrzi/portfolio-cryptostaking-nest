import { StringField } from '@/decorators';
import { Address, Hex } from 'viem';
export class UserLoginDto {
  @StringField({ maxLength: 132, minLength: 132 })
  readonly signature!: Hex;

  @StringField({ maxLength: 42, minLength: 42 })
  readonly wallet_address!: Address;
}
