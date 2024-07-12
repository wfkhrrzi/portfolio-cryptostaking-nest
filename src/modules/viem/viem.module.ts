import { DynamicModule, Global, Module } from '@nestjs/common';
import { IsValidChainValidatorConstraint } from './decorators/validator.decorators';
import { VIEM_MODULE_OPTIONS } from './viem.constants';
import { ViemModuleAsyncOptions, ViemModuleOptions } from './viem.interface';
import { ViemService } from './viem.service';

@Global()
@Module({
  providers: [ViemService, IsValidChainValidatorConstraint],
  exports: [ViemService],
})
export class ViemModule {
  static forRoot(options: ViemModuleOptions): DynamicModule {
    return {
      module: ViemModule,
      exports: [ViemService],
      providers: [{ provide: VIEM_MODULE_OPTIONS, useValue: options }],
    };
  }

  static forRootAsync(options: ViemModuleAsyncOptions): DynamicModule {
    return {
      module: ViemModule,
      imports: options.imports,
      exports: [ViemService],
      providers: [
        {
          provide: VIEM_MODULE_OPTIONS,
          ...options,
        },
      ],
    };
  }
}
