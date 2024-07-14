import { Web3ParamsDto } from '@/common/dto/api-web3-params.dto';
import { ClassField, NumberField, WalletAddressField } from '@/decorators';
import { UserDto } from '@/modules/user-v2/dtos/user.dto';
import { Address } from 'viem';

export class CreateTokenDto extends Web3ParamsDto {
  @WalletAddressField()
  contract_address!: Address;

  @NumberField({ isPositive: true })
  stake_APR!: number;

  @ClassField(() => UserDto)
  user?: UserDto;
}
