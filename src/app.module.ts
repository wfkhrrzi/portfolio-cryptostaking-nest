import './boilerplate.polyfill';

import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { http } from 'viem';
import { bsc, bscTestnet, hardhat } from 'viem/chains';
import { RedisOptions } from './configs/app-options.constants';
import { ApiResponseInterceptor } from './interceptors/api-response-interceptor.service';
import { AuthModule } from './modules/auth-siwe/auth.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { PostModule } from './modules/post/post.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { SeederService } from './modules/seeder/seeder.service';
import { StakingModule } from './modules/staking/staking.module';
import { TokenModule } from './modules/token/token.module';
import { UserModule } from './modules/user-v2/user.module';
import { ViemModule } from './modules/viem/viem.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PostModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => ({
        throttlers: [configService.throttlerConfigs],
      }),
      inject: [ApiConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
      },
    }),
    HealthCheckerModule,
    StakingModule,
    TokenModule,
    CacheModule.registerAsync(RedisOptions),
    SeederModule,
    ViemModule.forRootAsync({
      useFactory: async (configService: ApiConfigService) => {
        if (configService.isLocalContractTest) {
          // return local config
          return {
            chains: [hardhat],
          };
        }
        // return testnet config
        else
          return {
            chains: [bscTestnet, bsc],
            http_transports: [
              http(),
              http(
                `https://bsc-testnet.nodereal.io/v1/${configService.nodeRealConfig.key}`,
                { batch: { batchSize: 300 } },
              ),
            ],
          };
      },
      inject: [ApiConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private seeder: SeederService) {}

  async onApplicationBootstrap() {
    await this.seeder.run();
  }
}
