import { Web3ParamsDto } from '@/common/dto/api-web3-params.dto';
import { NumberField, WalletAddressField } from '@/decorators';
import { Address } from 'viem';

export class CreateTokenDto extends Web3ParamsDto {
  @WalletAddressField()
  contract_address!: Address;

  @NumberField({ isPositive: true })
  stake_APR!: number;
}
