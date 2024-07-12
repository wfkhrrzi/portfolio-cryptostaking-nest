import { DuplicateResourceCreated } from '@/exceptions/duplicate-resource-created.exception';
import { TokenService } from '@/modules/token/token.service';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { Injectable } from '@nestjs/common';
import { bscTestnet, hardhat } from 'viem/chains';
import { CreateTokenDto } from '../token/dtos/create-token.dto';

@Injectable()
export class SeederService {
  constructor(
    private tokenService: TokenService,
    private configService: ApiConfigService,
  ) {}

  /**
   * Single entrypoint for seeding run by main app. Include all seed handlers in this function
   */
  async run() {
    await this.tokenSeeder();
  }

  private async tokenSeeder() {
    // seed 'usdt' token
    const testnet_usdt_contract: CreateTokenDto = {
      contract_address: '0x281164a08efe10445772B26D2154fd6F4b90Fc08',
      stake_APR: 3,
      chain_id: bscTestnet.id,
    };

    const local_usdt_contract: CreateTokenDto = {
      contract_address: this.configService.localContract.usdt_contract,
      stake_APR: 3,
      chain_id: hardhat.id,
    };

    try {
      await this.tokenService.create(
        this.configService.isLocalContractTest
          ? local_usdt_contract
          : testnet_usdt_contract,
      );
    } catch (error) {
      if (!(error instanceof DuplicateResourceCreated)) throw error;
    }
  }
}
