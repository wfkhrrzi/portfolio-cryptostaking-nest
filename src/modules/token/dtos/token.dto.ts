import { AbstractDto } from '@/common/dto/abstract.dto';
import { NumberField, StringField } from '@/decorators';
import { Address } from 'viem';
import { TokenEntity } from '../token.entity';

export class TokenDto extends AbstractDto {
  @StringField({ maxLength: 50 })
  name: string;

  @StringField({ maxLength: 5 })
  symbol: string;

  @StringField({ minLength: 42, maxLength: 42 })
  contract_address: Address;

  @NumberField()
  stake_APR: number;

  constructor(token: TokenEntity) {
    super(token), (this.name = token.name);
    this.symbol = token.symbol;
    this.contract_address = token.contract_address;
    this.stake_APR = token.stake_APR;
  }
}
