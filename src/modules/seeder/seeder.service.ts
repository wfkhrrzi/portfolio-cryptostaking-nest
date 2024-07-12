import { DuplicateResourceCreated } from '@/exceptions/duplicate-resource-created.exception';
import { TokenService } from '@/modules/token/token.service';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { bscTestnet, hardhat } from 'viem/chains';
import { CreateNetworkChainDto } from '../network-chain/dto/create-network-chain.dto';
import { NetworkChainService } from '../network-chain/network-chain.service';
import { CreateTokenDto } from '../token/dtos/create-token.dto';
import { VIEM_MODULE_OPTIONS } from '../viem/viem.constants';
import { ViemModuleOptions } from '../viem/viem.interface';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    private networkChainService: NetworkChainService,
    private tokenService: TokenService,
    private configService: ApiConfigService,
    @Inject(VIEM_MODULE_OPTIONS) private viem_options: ViemModuleOptions,
  ) {}

  /**
   * Run all seeders on application bootstrap
   */
  async onApplicationBootstrap() {
    await this.networkChainSeeder();
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

  private async networkChainSeeder() {
    // seed all registered  chains
    const chains: CreateNetworkChainDto[] = this.viem_options.chains.map(
      (chain) => ({ chain_id: chain.id, chain_name: chain.name }),
    );

    try {
      await this.networkChainService.create(chains);
    } catch (error) {
      if (!(error instanceof DuplicateResourceCreated)) throw error;
    }
  }
}
