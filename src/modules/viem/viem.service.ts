import { chains } from '@/constants/chains';
import { ChainNotSupportedException } from '@/exceptions/chain-not-supported.exception';
import { Inject, Injectable } from '@nestjs/common';
import { createPublicClient, http } from 'viem';
import { VIEM_MODULE_OPTIONS } from './viem.constants';
import { ViemModuleOptions } from './viem.interface';

@Injectable()
export class ViemService {
  constructor(
    @Inject(VIEM_MODULE_OPTIONS) private options: ViemModuleOptions,
  ) {}

  isValidChain(chainId: number): boolean {
    return this.options.chains.map((chain) => chain.id).includes(chainId);
  }

  getPublicClient(chainId: number) {
    // validate chain
    if (!this.isValidChain(chainId)) {
      // throw error
      throw new ChainNotSupportedException(chainId);
    }

    // return public client
    return createPublicClient({
      transport: http(),
      chain: chains.find((chain) => chain.id == chainId),
    });
  }
}
