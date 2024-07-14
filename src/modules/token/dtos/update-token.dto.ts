import {
  ClassField,
  NumberFieldOptional,
  StringFieldOptional,
  WalletAddressFieldOptional,
} from '@/decorators';
import { UserDto } from '@/modules/user-v2/dtos/user.dto';
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

  @ClassField(() => UserDto)
  user?: UserDto;
}
