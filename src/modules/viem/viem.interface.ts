import { ModuleMetadata } from '@nestjs/common';
import { Chain } from 'viem';

export interface ViemModuleOptions {
  chains: Chain[];
}

export interface ViemModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useFactory: (
    ...args: any[]
  ) => ViemModuleOptions | Promise<ViemModuleOptions>;
  inject?: any[];
}
