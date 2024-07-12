import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenController } from './token.controller';
import { TokenEntity } from './token.entity';
import { TokenService } from './token.service';
import { ApiConfigService } from '@/shared/services/api-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity])],
  controllers: [TokenController],
  providers: [TokenService, ApiConfigService],
  exports: [TokenService],
})
export class TokenModule {}
