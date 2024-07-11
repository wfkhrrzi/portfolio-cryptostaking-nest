import {
  NumberFieldOptional,
  StringFieldOptional,
  WalletAddressFieldOptional,
} from '@/decorators';
import { Address } from 'viem';

export class UpdateTokenDto {
  @StringFieldOptional({ maxLength: 50 })
  name?: string;

  @StringFieldOptional({ maxLength: 5 })
  symbol?: string;

  @WalletAddressFieldOptional()
  contract_address?: Address;

  @NumberFieldOptional({ isPositive: true })
  stake_APR?: number;
}
