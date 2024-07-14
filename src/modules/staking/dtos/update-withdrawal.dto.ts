import { Web3ParamsDto } from '@/common/dto/api-web3-params.dto';
import { HashField } from '@/decorators';
import { Hex } from 'viem';

export class UpdateWithdrawalDto extends Web3ParamsDto {
  @HashField()
  tx_hash!: Hex;

  @HashField()
  signature!: Hex;
}
