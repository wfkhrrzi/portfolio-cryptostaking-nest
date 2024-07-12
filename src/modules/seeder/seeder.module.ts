import { TokenModule } from '@/modules/token/token.module';
import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Module({
  imports: [TokenModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
