import { StringField } from '@/decorators';
import { Address } from 'viem';

export class UserRegisterDto {
  @StringField({ toLowerCase: true, maxLength: 42, minLength: 42 })
  readonly wallet_address!: Address;
}
