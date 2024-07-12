import { TokenModule } from '@/modules/token/token.module';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { Module } from '@nestjs/common';
import { NetworkChainModule } from '../network-chain/network-chain.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [TokenModule, NetworkChainModule],
  providers: [SeederService, ApiConfigService],
  exports: [SeederService],
})
export class SeederModule {}
