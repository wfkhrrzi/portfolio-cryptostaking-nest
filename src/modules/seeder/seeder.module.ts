import { TokenModule } from '@/modules/token/token.module';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Module({
  imports: [TokenModule],
  providers: [SeederService, ApiConfigService],
  exports: [SeederService],
})
export class SeederModule {}
