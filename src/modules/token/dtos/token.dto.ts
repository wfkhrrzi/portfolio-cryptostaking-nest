import { AbstractDto } from '@/common/dto/abstract.dto';
import {
  NumberField,
  NumberFieldOptional,
  StringFieldOptional,
  WalletAddressFieldOptional,
} from '@/decorators';
import { Address } from 'viem';
import { TokenEntity } from '../token.entity';

export class TokenDto extends AbstractDto {
  @StringFieldOptional({ maxLength: 50 })
  name: string;

  @StringFieldOptional({ maxLength: 5 })
  symbol: string;

  @WalletAddressFieldOptional()
  contract_address: Address;

  @NumberFieldOptional({ isPositive: true })
  decimals: number;

  @NumberField({ isPositive: true })
  stake_APR: number;

  constructor(token: TokenEntity) {
    super(token), (this.name = token.name);
    this.symbol = token.symbol;
    this.contract_address = token.contract_address;
    this.decimals = token.decimals;
    this.stake_APR = token.stake_APR;
  }
}
